import type { Customer, Prisma } from '@prisma/client';
import { getTenantPrisma } from '@/lib/db/tenant';
import type { CreateCustomerInput, UpdateCustomerInput } from './schemas';

function omitUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).filter(
      ([, v]) => v !== undefined,
    ),
  ) as Partial<T>;
}

export async function createCustomer(
  organizationId: string,
  userId: string,
  input: CreateCustomerInput,
): Promise<Customer> {
  const db = getTenantPrisma(organizationId);
  return db.customer.create({
    data: {
      name: input.name,
      cpfCnpj: input.cpfCnpj ?? null,
      rg: input.rg ?? null,
      birthDate: input.birthDate ?? null,
      phone: input.phone ?? null,
      phoneSecondary: input.phoneSecondary ?? null,
      email: input.email ?? null,
      addressStreet: input.addressStreet ?? null,
      addressNumber: input.addressNumber ?? null,
      addressComplement: input.addressComplement ?? null,
      addressNeighborhood: input.addressNeighborhood ?? null,
      addressCity: input.addressCity ?? null,
      addressState: input.addressState ?? null,
      addressZip: input.addressZip ?? null,
      occupation: input.occupation ?? null,
      monthlyIncomeCents: input.monthlyIncomeCents ?? null,
      employerName: input.employerName ?? null,
      notes: input.notes ?? null,
      tags: input.tags,
      organizationId,
      createdBy: userId,
    },
  });
}

export async function updateCustomer(
  organizationId: string,
  customerId: string,
  input: UpdateCustomerInput,
): Promise<Customer> {
  const db = getTenantPrisma(organizationId);
  const existing = await db.customer.findFirst({
    where: { id: customerId, deletedAt: null },
  });
  if (!existing) throw new Error('Customer not found');
  const patch = omitUndefined(input) as UpdateCustomerInput;
  return db.customer.update({
    where: { id: customerId },
    data: patch as Prisma.CustomerUpdateInput,
  });
}

export async function deleteCustomer(
  organizationId: string,
  customerId: string,
): Promise<void> {
  const db = getTenantPrisma(organizationId);
  await db.customer.update({
    where: { id: customerId },
    data: { deletedAt: new Date() },
  });
}

export async function getCustomerById(
  organizationId: string,
  customerId: string,
) {
  const db = getTenantPrisma(organizationId);
  return db.customer.findFirst({
    where: { id: customerId, deletedAt: null },
    include: {
      leads: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function listCustomers(
  organizationId: string,
  params: { search?: string; page?: number; pageSize?: number },
) {
  const db = getTenantPrisma(organizationId);
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;

  const where: Prisma.CustomerWhereInput = { deletedAt: null };

  if (params.search?.trim()) {
    const q = params.search.trim();
    const digits = q.replace(/\D/g, '');
    const or: Prisma.CustomerWhereInput[] = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ];
    if (digits.length > 0) {
      or.push({ cpfCnpj: { contains: digits } });
      or.push({ phone: { contains: digits } });
    }
    where.OR = or;
  }

  const [total, items] = await Promise.all([
    db.customer.count({ where }),
    db.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Converte um lead em customer quando a venda fecha.
 * Cria o customer baseado nos dados do lead e linka o lead.customerId.
 */
export async function convertLeadToCustomer(
  organizationId: string,
  userId: string,
  leadId: string,
  additionalData?: Partial<CreateCustomerInput>,
): Promise<Customer> {
  const db = getTenantPrisma(organizationId);

  const lead = await db.lead.findFirst({
    where: { id: leadId, deletedAt: null },
  });
  if (!lead) throw new Error('Lead not found');
  if (lead.customerId) {
    throw new Error('Lead already has a customer');
  }

  const extra = omitUndefined((additionalData ?? {}) as CreateCustomerInput);
  const customer = await db.customer.create({
    data: {
      organizationId,
      name: extra.name ?? lead.name,
      phone: extra.phone ?? lead.phone,
      email: extra.email ?? lead.email,
      cpfCnpj: extra.cpfCnpj ?? lead.cpf,
      rg: extra.rg,
      birthDate: extra.birthDate,
      phoneSecondary: extra.phoneSecondary,
      addressStreet: extra.addressStreet,
      addressNumber: extra.addressNumber,
      addressComplement: extra.addressComplement,
      addressNeighborhood: extra.addressNeighborhood,
      addressCity: extra.addressCity,
      addressState: extra.addressState,
      addressZip: extra.addressZip,
      occupation: extra.occupation,
      monthlyIncomeCents: extra.monthlyIncomeCents,
      employerName: extra.employerName,
      notes: extra.notes,
      tags: extra.tags ?? [],
      createdBy: userId,
    },
  });

  await db.lead.update({
    where: { id: leadId },
    data: {
      customerId: customer.id,
      status: 'WON',
      wonAt: new Date(),
    },
  });

  return customer;
}
