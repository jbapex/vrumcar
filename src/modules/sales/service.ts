import type { Prisma, Sale } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getTenantPrisma } from '@/lib/db/tenant';
import type { RegisterSaleInput, SaleFilters } from './schemas';

/**
 * Erro específico pra validação de vendas (distingue de erro de
 * infraestrutura).
 */
export class SaleValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SaleValidationError';
  }
}

/**
 * Registra uma venda numa transação ATÔMICA que:
 * 1. Valida que o veículo existe, pertence à org e está vendível
 *    (status != SOLD, != INACTIVE)
 * 2. Se leadId foi passado, busca o lead e resolve customer
 *    (ou cria customer a partir do lead se ele não tinha)
 * 3. Cria Sale
 * 4. Atualiza Vehicle.status = SOLD
 * 5. Se tinha lead: atualiza Lead.status = WON, lead.customerId,
 *    lead.wonAt, e cria LeadInteraction STATUS_CHANGE
 *
 * Se qualquer passo falhar, NADA é persistido.
 */
export async function registerSale(
  organizationId: string,
  userId: string,
  input: RegisterSaleInput,
): Promise<Sale> {
  return prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.findFirst({
      where: {
        id: input.vehicleId,
        organizationId,
        deletedAt: null,
      },
    });
    if (!vehicle) {
      throw new SaleValidationError('Veículo não encontrado');
    }
    if (vehicle.status === 'INACTIVE') {
      throw new SaleValidationError('Veículo inativo não pode ser vendido');
    }
    if (vehicle.status === 'SOLD') {
      throw new SaleValidationError('Este veículo já foi vendido');
    }

    const claimed = await tx.vehicle.updateMany({
      where: {
        id: input.vehicleId,
        organizationId,
        deletedAt: null,
        status: { notIn: ['SOLD', 'INACTIVE'] },
      },
      data: { status: 'SOLD', updatedBy: userId },
    });
    if (claimed.count !== 1) {
      throw new SaleValidationError('Este veículo já foi vendido');
    }

    let customerId = input.customerId ?? null;
    let lead: Awaited<ReturnType<typeof tx.lead.findFirst>> = null;

    if (input.leadId) {
      const existingForLead = await tx.sale.findFirst({
        where: {
          leadId: input.leadId,
          status: { in: ['PENDING', 'COMPLETED'] },
        },
      });
      if (existingForLead) {
        throw new SaleValidationError(
          'Já existe uma venda ativa para este lead',
        );
      }

      lead = await tx.lead.findFirst({
        where: {
          id: input.leadId,
          organizationId,
          deletedAt: null,
        },
      });
      if (!lead) {
        throw new SaleValidationError('Lead não encontrado');
      }
      if (lead.status === 'WON') {
        throw new SaleValidationError(
          'Este lead já foi marcado como ganhou. Cancele a venda anterior antes.',
        );
      }

      if (lead.customerId) {
        customerId = lead.customerId;
      } else if (!customerId) {
        const newCustomer = await tx.customer.create({
          data: {
            organizationId,
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            cpfCnpj: lead.cpf,
            createdBy: userId,
          },
        });
        customerId = newCustomer.id;
      }
    }

    if (!customerId) {
      throw new SaleValidationError(
        'Customer obrigatório (passe customerId ou leadId com dados)',
      );
    }

    const customer = await tx.customer.findFirst({
      where: { id: customerId, organizationId, deletedAt: null },
    });
    if (!customer) {
      throw new SaleValidationError('Cliente não encontrado');
    }

    const salesPerson = await tx.user.findUnique({
      where: { id: input.salesPersonId },
      include: {
        memberships: {
          where: { organizationId, isActive: true },
          take: 1,
        },
      },
    });
    if (!salesPerson || salesPerson.memberships.length === 0) {
      throw new SaleValidationError('Vendedor inválido');
    }

    const discountCents = Math.max(
      0,
      vehicle.salePriceCents - input.finalPriceCents,
    );

    const sale = await tx.sale.create({
      data: {
        organizationId,
        vehicleId: input.vehicleId,
        customerId,
        leadId: input.leadId ?? null,
        salesPersonId: input.salesPersonId,
        listPriceCents: vehicle.salePriceCents,
        finalPriceCents: input.finalPriceCents,
        discountCents,
        paymentMethod: input.paymentMethod,
        paymentNotes: input.paymentNotes ?? null,
        hasTradeIn: input.hasTradeIn,
        tradeInBrand: input.tradeInBrand ?? null,
        tradeInModel: input.tradeInModel ?? null,
        tradeInYear: input.tradeInYear ?? null,
        tradeInMileageKm: input.tradeInMileageKm ?? null,
        tradeInPlate: input.tradeInPlate ?? null,
        tradeInValueCents: input.tradeInValueCents ?? null,
        tradeInNotes: input.tradeInNotes ?? null,
        contractNumber: input.contractNumber ?? null,
        notes: input.notes ?? null,
        soldAt: input.soldAt ?? new Date(),
        status: 'COMPLETED',
        createdBy: userId,
      },
    });

    if (lead) {
      await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: 'WON',
          wonAt: new Date(),
          customerId,
        },
      });

      const meta: Prisma.InputJsonValue = { saleId: sale.id };
      await tx.leadInteraction.create({
        data: {
          organizationId,
          leadId: lead.id,
          type: 'STATUS_CHANGE',
          content: `Venda registrada: R$ ${(input.finalPriceCents / 100).toFixed(2)}`,
          metadata: meta,
          createdBy: userId,
        },
      });
    }

    return sale;
  });
}

/**
 * Cancela uma venda: reverte Vehicle pra AVAILABLE e Lead pra
 * NEGOTIATING (se tinha lead). Mantém o registro da Sale com
 * status CANCELLED. Libera `leadId` na venda (null) para permitir
 * nova venda com o mesmo lead (constraint única).
 */
export async function cancelSale(
  organizationId: string,
  userId: string,
  saleId: string,
  reason: string,
): Promise<Sale> {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findFirst({
      where: { id: saleId, organizationId },
    });
    if (!sale) {
      throw new SaleValidationError('Venda não encontrada');
    }
    if (sale.status === 'CANCELLED') {
      throw new SaleValidationError('Venda já está cancelada');
    }

    const linkedLeadId = sale.leadId;

    const cancelled = await tx.sale.update({
      where: { id: saleId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledReason: reason,
        leadId: null,
      },
    });

    await tx.vehicle.update({
      where: { id: sale.vehicleId },
      data: { status: 'AVAILABLE', updatedBy: userId },
    });

    if (linkedLeadId) {
      await tx.lead.update({
        where: { id: linkedLeadId },
        data: {
          status: 'NEGOTIATING',
          wonAt: null,
        },
      });

      const meta: Prisma.InputJsonValue = { saleId: sale.id };
      await tx.leadInteraction.create({
        data: {
          organizationId,
          leadId: linkedLeadId,
          type: 'STATUS_CHANGE',
          content: `Venda cancelada. Motivo: ${reason}`,
          metadata: meta,
          createdBy: userId,
        },
      });
    }

    return cancelled;
  });
}

export async function getSaleById(organizationId: string, saleId: string) {
  const db = getTenantPrisma(organizationId);
  return db.sale.findFirst({
    where: { id: saleId },
    include: {
      vehicle: true,
      customer: true,
      lead: true,
      salesPerson: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function listSales(organizationId: string, filters: SaleFilters) {
  const db = getTenantPrisma(organizationId);

  const where: Prisma.SaleWhereInput = {};

  if (filters.status) where.status = filters.status;
  if (filters.salesPersonId) where.salesPersonId = filters.salesPersonId;
  if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;

  if (filters.soldAfter || filters.soldBefore) {
    where.soldAt = {};
    if (filters.soldAfter) where.soldAt.gte = filters.soldAfter;
    if (filters.soldBefore) where.soldAt.lte = filters.soldBefore;
  }

  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      {
        customer: {
          name: { contains: q, mode: 'insensitive' },
        },
      },
      {
        vehicle: { brand: { contains: q, mode: 'insensitive' } },
      },
      {
        vehicle: { model: { contains: q, mode: 'insensitive' } },
      },
      {
        vehicle: { licensePlate: { contains: q, mode: 'insensitive' } },
      },
      {
        contractNumber: { contains: q, mode: 'insensitive' },
      },
    ];
  }

  const orderBy = {
    [filters.orderBy]: filters.orderDir,
  } as Prisma.SaleOrderByWithRelationInput;

  const [total, items] = await Promise.all([
    db.sale.count({ where }),
    db.sale.findMany({
      where,
      include: {
        vehicle: {
          select: { id: true, brand: true, model: true, year: true },
        },
        customer: { select: { id: true, name: true } },
        salesPerson: { select: { id: true, name: true } },
      },
      orderBy,
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.ceil(total / filters.pageSize),
  };
}
