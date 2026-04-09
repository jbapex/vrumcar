import { afterAll, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/db';
import { createVehicle } from '@/modules/vehicles/service';
import { registerSaleSchema, saleFiltersSchema } from '../schemas';
import {
  SaleValidationError,
  cancelSale,
  listSales,
  registerSale,
} from '../service';

describe('sales service', () => {
  const createdOrgIds: string[] = [];
  const createdUserIds: string[] = [];

  afterAll(async () => {
    try {
      if (createdOrgIds.length > 0) {
        await prisma.organization.deleteMany({
          where: { id: { in: createdOrgIds } },
        });
      }
      if (createdUserIds.length > 0) {
        await prisma.user.deleteMany({
          where: { id: { in: createdUserIds } },
        });
      }
    } catch {
      // DB pode estar indisponível
    }
    await prisma.$disconnect().catch(() => {});
  });

  async function createTestOrg(suffix: string) {
    const t = Date.now();
    const org = await prisma.organization.create({
      data: {
        slug: `sale-svc-${suffix}-${t}`,
        name: `Loja Vendas ${suffix} ${t}`,
      },
    });
    createdOrgIds.push(org.id);
    return org;
  }

  async function createSeller(orgId: string, label: string) {
    const t = Date.now();
    const user = await prisma.user.create({
      data: {
        email: `sale-${label}-${t}@test.local`,
        name: `Vendedor ${label}`,
      },
    });
    createdUserIds.push(user.id);
    await prisma.membership.create({
      data: {
        organizationId: orgId,
        userId: user.id,
        role: 'SALES',
      },
    });
    return user;
  }

  function baseInput(
    vehicleId: string,
    salesPersonId: string,
    finalPriceCents: number,
    extra: Partial<ReturnType<typeof registerSaleSchema.parse>> = {},
  ) {
    return registerSaleSchema.parse({
      vehicleId,
      salesPersonId,
      finalPriceCents,
      paymentMethod: 'CASH',
      ...extra,
    });
  }

  describe('registerSale happy path', () => {
    it('cria venda a partir de lead com customer existente', async () => {
      const org = await createTestOrg('lead-cust');
      const seller = await createSeller(org.id, 's1');
      const customer = await prisma.customer.create({
        data: {
          organizationId: org.id,
          name: 'Cliente Existe',
          createdBy: seller.id,
        },
      });
      const vehicle = await createVehicle(org.id, seller.id, {
        brand: 'Fiat',
        model: 'Argo',
        salePriceCents: 70_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });
      const lead = await prisma.lead.create({
        data: {
          organizationId: org.id,
          name: 'Lead X',
          customerId: customer.id,
          status: 'NEGOTIATING',
          createdBy: seller.id,
        },
      });

      const sale = await registerSale(
        org.id,
        seller.id,
        baseInput(vehicle.id, seller.id, 68_000_00, { leadId: lead.id }),
      );

      expect(sale.leadId).toBe(lead.id);
      expect(sale.customerId).toBe(customer.id);
      const refreshedLead = await prisma.lead.findUnique({
        where: { id: lead.id },
      });
      expect(refreshedLead?.status).toBe('WON');
      expect(refreshedLead?.customerId).toBe(customer.id);
    });

    it('cria customer automaticamente se lead não tinha', async () => {
      const org = await createTestOrg('auto-cust');
      const seller = await createSeller(org.id, 's2');
      const vehicle = await createVehicle(org.id, seller.id, {
        brand: 'VW',
        model: 'Polo',
        salePriceCents: 65_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });
      const lead = await prisma.lead.create({
        data: {
          organizationId: org.id,
          name: 'Lead Novo Cliente',
          phone: '11999887766',
          status: 'QUALIFIED',
          createdBy: seller.id,
        },
      });

      const sale = await registerSale(
        org.id,
        seller.id,
        baseInput(vehicle.id, seller.id, 64_000_00, { leadId: lead.id }),
      );

      const cust = await prisma.customer.findUnique({
        where: { id: sale.customerId },
      });
      expect(cust?.name).toBe('Lead Novo Cliente');
      expect(cust?.phone).toBe('11999887766');
      const refreshedLead = await prisma.lead.findUnique({
        where: { id: lead.id },
      });
      expect(refreshedLead?.customerId).toBe(sale.customerId);
    });

    it('marca Vehicle como SOLD', async () => {
      const org = await createTestOrg('sold-v');
      const seller = await createSeller(org.id, 's3');
      const customer = await prisma.customer.create({
        data: { organizationId: org.id, name: 'C', createdBy: seller.id },
      });
      const vehicle = await createVehicle(org.id, seller.id, {
        brand: 'Toyota',
        model: 'Yaris',
        salePriceCents: 80_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });

      await registerSale(
        org.id,
        seller.id,
        baseInput(vehicle.id, seller.id, 79_000_00, {
          customerId: customer.id,
        }),
      );

      const v = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
      expect(v?.status).toBe('SOLD');
    });

    it('marca Lead como WON e linka customerId', async () => {
      const org = await createTestOrg('won');
      const seller = await createSeller(org.id, 's4');
      const customer = await prisma.customer.create({
        data: { organizationId: org.id, name: 'C2', createdBy: seller.id },
      });
      const vehicle = await createVehicle(org.id, seller.id, {
        brand: 'Honda',
        model: 'Fit',
        salePriceCents: 55_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });
      const lead = await prisma.lead.create({
        data: {
          organizationId: org.id,
          name: 'L',
          customerId: customer.id,
          status: 'CONTACTED',
          createdBy: seller.id,
        },
      });

      await registerSale(
        org.id,
        seller.id,
        baseInput(vehicle.id, seller.id, 54_000_00, { leadId: lead.id }),
      );

      const refreshed = await prisma.lead.findUnique({ where: { id: lead.id } });
      expect(refreshed?.status).toBe('WON');
      expect(refreshed?.customerId).toBe(customer.id);
      expect(refreshed?.wonAt).not.toBeNull();
    });

    it('cria LeadInteraction STATUS_CHANGE', async () => {
      const org = await createTestOrg('ix');
      const seller = await createSeller(org.id, 's5');
      const customer = await prisma.customer.create({
        data: { organizationId: org.id, name: 'C3', createdBy: seller.id },
      });
      const vehicle = await createVehicle(org.id, seller.id, {
        brand: 'Hyundai',
        model: 'HB20',
        salePriceCents: 50_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });
      const lead = await prisma.lead.create({
        data: {
          organizationId: org.id,
          name: 'L2',
          customerId: customer.id,
          status: 'NEGOTIATING',
          createdBy: seller.id,
        },
      });

      await registerSale(
        org.id,
        seller.id,
        baseInput(vehicle.id, seller.id, 49_000_00, { leadId: lead.id }),
      );

      const ix = await prisma.leadInteraction.findFirst({
        where: { leadId: lead.id, type: 'STATUS_CHANGE' },
        orderBy: { createdAt: 'desc' },
      });
      expect(ix?.content).toContain('Venda registrada');
    });

    it('calcula discountCents automaticamente', async () => {
      const org = await createTestOrg('disc');
      const seller = await createSeller(org.id, 's6');
      const customer = await prisma.customer.create({
        data: { organizationId: org.id, name: 'C4', createdBy: seller.id },
      });
      const vehicle = await createVehicle(org.id, seller.id, {
        brand: 'Renault',
        model: 'Kwid',
        salePriceCents: 40_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });

      const sale = await registerSale(
        org.id,
        seller.id,
        baseInput(vehicle.id, seller.id, 35_000_00, {
          customerId: customer.id,
        }),
      );

      expect(sale.listPriceCents).toBe(40_000_00);
      expect(sale.finalPriceCents).toBe(35_000_00);
      expect(sale.discountCents).toBe(5_000_00);
    });

    it('aceita venda sem lead (compra direta)', async () => {
      const org = await createTestOrg('direct');
      const seller = await createSeller(org.id, 's7');
      const customer = await prisma.customer.create({
        data: { organizationId: org.id, name: 'Walk-in', createdBy: seller.id },
      });
      const vehicle = await createVehicle(org.id, seller.id, {
        brand: 'Chevrolet',
        model: 'Onix',
        salePriceCents: 72_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });

      const sale = await registerSale(
        org.id,
        seller.id,
        baseInput(vehicle.id, seller.id, 71_000_00, {
          customerId: customer.id,
        }),
      );

      expect(sale.leadId).toBeNull();
    });

    it('com trade-in guarda todos os campos', async () => {
      const org = await createTestOrg('trade');
      const seller = await createSeller(org.id, 's8');
      const customer = await prisma.customer.create({
        data: { organizationId: org.id, name: 'C5', createdBy: seller.id },
      });
      const vehicle = await createVehicle(org.id, seller.id, {
        brand: 'Ford',
        model: 'Ka',
        salePriceCents: 45_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });

      const sale = await registerSale(
        org.id,
        seller.id,
        baseInput(vehicle.id, seller.id, 40_000_00, {
          customerId: customer.id,
          hasTradeIn: true,
          tradeInBrand: 'VW',
          tradeInModel: 'Gol',
          tradeInYear: 2015,
          tradeInMileageKm: 90_000,
          tradeInPlate: 'abc1d23',
          tradeInValueCents: 15_000_00,
          tradeInNotes: 'Bom estado',
        }),
      );

      expect(sale.hasTradeIn).toBe(true);
      expect(sale.tradeInBrand).toBe('VW');
      expect(sale.tradeInModel).toBe('Gol');
      expect(sale.tradeInYear).toBe(2015);
      expect(sale.tradeInMileageKm).toBe(90_000);
      expect(sale.tradeInPlate).toBe('ABC1D23');
      expect(sale.tradeInValueCents).toBe(15_000_00);
      expect(sale.tradeInNotes).toBe('Bom estado');
    });
  });

  describe('registerSale validações', () => {
    it('lança erro se veículo já está SOLD', async () => {
      const org = await createTestOrg('vsold');
      const seller = await createSeller(org.id, 's9');
      const customer = await prisma.customer.create({
        data: { organizationId: org.id, name: 'C6', createdBy: seller.id },
      });
      const vehicle = await createVehicle(org.id, seller.id, {
        brand: 'A',
        model: 'B',
        salePriceCents: 10_000_00,
        optionals: [],
        status: 'SOLD',
      });

      await expect(
        registerSale(
          org.id,
          seller.id,
          baseInput(vehicle.id, seller.id, 9_000_00, {
            customerId: customer.id,
          }),
        ),
      ).rejects.toThrow(SaleValidationError);
    });

    it('lança erro se veículo está INACTIVE', async () => {
      const org = await createTestOrg('vinact');
      const seller = await createSeller(org.id, 's10');
      const customer = await prisma.customer.create({
        data: { organizationId: org.id, name: 'C7', createdBy: seller.id },
      });
      const vehicle = await createVehicle(org.id, seller.id, {
        brand: 'A',
        model: 'C',
        salePriceCents: 10_000_00,
        optionals: [],
        status: 'INACTIVE',
      });

      await expect(
        registerSale(
          org.id,
          seller.id,
          baseInput(vehicle.id, seller.id, 9_000_00, {
            customerId: customer.id,
          }),
        ),
      ).rejects.toThrow(SaleValidationError);
    });

    it('lança erro se veículo é de outra org (isolation)', async () => {
      const org1 = await createTestOrg('iso1');
      const org2 = await createTestOrg('iso2');
      const seller1 = await createSeller(org1.id, 's11');
      const seller2 = await createSeller(org2.id, 's12');
      const customer1 = await prisma.customer.create({
        data: { organizationId: org1.id, name: 'C8', createdBy: seller1.id },
      });
      const vehicle2 = await createVehicle(org2.id, seller2.id, {
        brand: 'X',
        model: 'Y',
        salePriceCents: 20_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });

      await expect(
        registerSale(
          org1.id,
          seller1.id,
          baseInput(vehicle2.id, seller1.id, 19_000_00, {
            customerId: customer1.id,
          }),
        ),
      ).rejects.toThrow(SaleValidationError);
    });

    it('lança erro se lead já está WON', async () => {
      const org = await createTestOrg('lwon');
      const seller = await createSeller(org.id, 's13');
      const customer = await prisma.customer.create({
        data: { organizationId: org.id, name: 'C9', createdBy: seller.id },
      });
      const vehicle = await createVehicle(org.id, seller.id, {
        brand: 'M',
        model: 'N',
        salePriceCents: 30_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });
      const lead = await prisma.lead.create({
        data: {
          organizationId: org.id,
          name: 'WonLead',
          customerId: customer.id,
          status: 'WON',
          wonAt: new Date(),
          createdBy: seller.id,
        },
      });

      await expect(
        registerSale(
          org.id,
          seller.id,
          baseInput(vehicle.id, seller.id, 29_000_00, { leadId: lead.id }),
        ),
      ).rejects.toThrow(SaleValidationError);
    });

    it('lança erro se vendedor não tem membership ativa na org', async () => {
      const org = await createTestOrg('nomem');
      const seller = await createSeller(org.id, 's14');
      const stranger = await prisma.user.create({
        data: {
          email: `stranger-${Date.now()}@test.local`,
          name: 'Stranger',
        },
      });
      createdUserIds.push(stranger.id);
      const customer = await prisma.customer.create({
        data: { organizationId: org.id, name: 'C10', createdBy: seller.id },
      });
      const vehicle = await createVehicle(org.id, seller.id, {
        brand: 'P',
        model: 'Q',
        salePriceCents: 25_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });

      await expect(
        registerSale(
          org.id,
          seller.id,
          baseInput(vehicle.id, stranger.id, 24_000_00, {
            customerId: customer.id,
          }),
        ),
      ).rejects.toThrow(SaleValidationError);
    });

    it('lança erro se customerId E leadId forem null', async () => {
      const org = await createTestOrg('nocust');
      const seller = await createSeller(org.id, 's15');
      const vehicle = await createVehicle(org.id, seller.id, {
        brand: 'R',
        model: 'S',
        salePriceCents: 18_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });

      await expect(
        registerSale(
          org.id,
          seller.id,
          baseInput(vehicle.id, seller.id, 17_000_00, {
            customerId: null,
            leadId: null,
          }),
        ),
      ).rejects.toThrow(SaleValidationError);
    });
  });

  describe('atomicidade', () => {
    it('NÃO persiste nada se validação falhar (sem lead/customer)', async () => {
      const org = await createTestOrg('atomic');
      const seller = await createSeller(org.id, 's16');
      const vehicle = await createVehicle(org.id, seller.id, {
        brand: 'T',
        model: 'U',
        salePriceCents: 22_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });
      const beforeSales = await prisma.sale.count();
      const beforeIx = await prisma.leadInteraction.count();

      await expect(
        registerSale(
          org.id,
          seller.id,
          baseInput(vehicle.id, seller.id, 21_000_00),
        ),
      ).rejects.toThrow(SaleValidationError);

      expect(await prisma.sale.count()).toBe(beforeSales);
      expect(await prisma.leadInteraction.count()).toBe(beforeIx);
      const v = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
      expect(v?.status).toBe('AVAILABLE');
    });

    it('concorrência: só uma venda conclui no mesmo veículo', async () => {
      const org = await createTestOrg('conc');
      const seller = await createSeller(org.id, 's17');
      const c1 = await prisma.customer.create({
        data: { organizationId: org.id, name: 'K1', createdBy: seller.id },
      });
      const c2 = await prisma.customer.create({
        data: { organizationId: org.id, name: 'K2', createdBy: seller.id },
      });
      const vehicle = await createVehicle(org.id, seller.id, {
        brand: 'Z',
        model: 'Z',
        salePriceCents: 100_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });

      const input1 = baseInput(vehicle.id, seller.id, 99_000_00, {
        customerId: c1.id,
      });
      const input2 = baseInput(vehicle.id, seller.id, 98_000_00, {
        customerId: c2.id,
      });

      const results = await Promise.allSettled([
        registerSale(org.id, seller.id, input1),
        registerSale(org.id, seller.id, input2),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect(
        (rejected[0] as PromiseRejectedResult).reason,
      ).toBeInstanceOf(SaleValidationError);
    });
  });

  describe('cancelSale', () => {
    it('muda status pra CANCELLED e guarda motivo', async () => {
      const org = await createTestOrg('can1');
      const seller = await createSeller(org.id, 's18');
      const customer = await prisma.customer.create({
        data: { organizationId: org.id, name: 'CC', createdBy: seller.id },
      });
      const vehicle = await createVehicle(org.id, seller.id, {
        brand: 'Can',
        model: 'One',
        salePriceCents: 33_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });
      const sale = await registerSale(
        org.id,
        seller.id,
        baseInput(vehicle.id, seller.id, 32_000_00, {
          customerId: customer.id,
        }),
      );

      const cancelled = await cancelSale(
        org.id,
        seller.id,
        sale.id,
        'Cliente desistiu',
      );

      expect(cancelled.status).toBe('CANCELLED');
      expect(cancelled.cancelledReason).toBe('Cliente desistiu');
      expect(cancelled.cancelledAt).not.toBeNull();
      expect(cancelled.leadId).toBeNull();
    });

    it('reverte Vehicle pra AVAILABLE', async () => {
      const org = await createTestOrg('can2');
      const seller = await createSeller(org.id, 's19');
      const customer = await prisma.customer.create({
        data: { organizationId: org.id, name: 'CC2', createdBy: seller.id },
      });
      const vehicle = await createVehicle(org.id, seller.id, {
        brand: 'Can',
        model: 'Two',
        salePriceCents: 44_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });
      const sale = await registerSale(
        org.id,
        seller.id,
        baseInput(vehicle.id, seller.id, 43_000_00, {
          customerId: customer.id,
        }),
      );

      await cancelSale(org.id, seller.id, sale.id, 'Motivo');

      const v = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
      expect(v?.status).toBe('AVAILABLE');
    });

    it('reverte Lead pra NEGOTIATING', async () => {
      const org = await createTestOrg('can3');
      const seller = await createSeller(org.id, 's20');
      const customer = await prisma.customer.create({
        data: { organizationId: org.id, name: 'CC3', createdBy: seller.id },
      });
      const vehicle = await createVehicle(org.id, seller.id, {
        brand: 'Can',
        model: 'Three',
        salePriceCents: 55_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });
      const lead = await prisma.lead.create({
        data: {
          organizationId: org.id,
          name: 'LeadCan',
          customerId: customer.id,
          status: 'NEGOTIATING',
          createdBy: seller.id,
        },
      });
      const sale = await registerSale(
        org.id,
        seller.id,
        baseInput(vehicle.id, seller.id, 54_000_00, { leadId: lead.id }),
      );

      await cancelSale(org.id, seller.id, sale.id, 'Cancela lead');

      const l = await prisma.lead.findUnique({ where: { id: lead.id } });
      expect(l?.status).toBe('NEGOTIATING');
      expect(l?.wonAt).toBeNull();
    });

    it('cria LeadInteraction de cancelamento', async () => {
      const org = await createTestOrg('can4');
      const seller = await createSeller(org.id, 's21');
      const customer = await prisma.customer.create({
        data: { organizationId: org.id, name: 'CC4', createdBy: seller.id },
      });
      const vehicle = await createVehicle(org.id, seller.id, {
        brand: 'Can',
        model: 'Four',
        salePriceCents: 66_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });
      const lead = await prisma.lead.create({
        data: {
          organizationId: org.id,
          name: 'LeadCan2',
          customerId: customer.id,
          status: 'NEGOTIATING',
          createdBy: seller.id,
        },
      });
      const sale = await registerSale(
        org.id,
        seller.id,
        baseInput(vehicle.id, seller.id, 65_000_00, { leadId: lead.id }),
      );

      await cancelSale(org.id, seller.id, sale.id, 'Motivo longo abc');

      const ix = await prisma.leadInteraction.findFirst({
        where: { leadId: lead.id },
        orderBy: { createdAt: 'desc' },
      });
      expect(ix?.content).toContain('Venda cancelada');
      expect(ix?.content).toContain('Motivo longo abc');
    });

    it('lança erro se venda já está cancelada', async () => {
      const org = await createTestOrg('can5');
      const seller = await createSeller(org.id, 's22');
      const customer = await prisma.customer.create({
        data: { organizationId: org.id, name: 'CC5', createdBy: seller.id },
      });
      const vehicle = await createVehicle(org.id, seller.id, {
        brand: 'Can',
        model: 'Five',
        salePriceCents: 77_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });
      const sale = await registerSale(
        org.id,
        seller.id,
        baseInput(vehicle.id, seller.id, 76_000_00, {
          customerId: customer.id,
        }),
      );

      await cancelSale(org.id, seller.id, sale.id, 'R1');

      await expect(
        cancelSale(org.id, seller.id, sale.id, 'R2'),
      ).rejects.toThrow(SaleValidationError);
    });
  });

  describe('listSales', () => {
    it('filtra por status', async () => {
      const org = await createTestOrg('list-st');
      const seller = await createSeller(org.id, 's23');
      const customer = await prisma.customer.create({
        data: { organizationId: org.id, name: 'LST', createdBy: seller.id },
      });
      const v1 = await createVehicle(org.id, seller.id, {
        brand: 'L1',
        model: 'A',
        salePriceCents: 10_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });
      const v2 = await createVehicle(org.id, seller.id, {
        brand: 'L2',
        model: 'B',
        salePriceCents: 11_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });
      const s1 = await registerSale(
        org.id,
        seller.id,
        baseInput(v1.id, seller.id, 9_000_00, { customerId: customer.id }),
      );
      await registerSale(
        org.id,
        seller.id,
        baseInput(v2.id, seller.id, 10_000_00, { customerId: customer.id }),
      );
      await cancelSale(org.id, seller.id, s1.id, 'x');

      const filters = saleFiltersSchema.parse({
        status: 'COMPLETED',
        page: 1,
        pageSize: 20,
      });
      const r = await listSales(org.id, filters);
      expect(r.items.every((i) => i.status === 'COMPLETED')).toBe(true);
    });

    it('filtra por salesPersonId', async () => {
      const org = await createTestOrg('list-sp');
      const a = await createSeller(org.id, 'sa');
      const b = await createSeller(org.id, 'sb');
      const customer = await prisma.customer.create({
        data: { organizationId: org.id, name: 'LSP', createdBy: a.id },
      });
      const v = await createVehicle(org.id, a.id, {
        brand: 'Sp',
        model: 'X',
        salePriceCents: 12_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });
      await registerSale(
        org.id,
        a.id,
        baseInput(v.id, a.id, 11_000_00, { customerId: customer.id }),
      );

      const filters = saleFiltersSchema.parse({
        salesPersonId: b.id,
        page: 1,
        pageSize: 20,
      });
      const r = await listSales(org.id, filters);
      expect(r.items).toHaveLength(0);
    });

    it('filtra por intervalo de datas', async () => {
      const org = await createTestOrg('list-dt');
      const seller = await createSeller(org.id, 'sdt');
      const customer = await prisma.customer.create({
        data: { organizationId: org.id, name: 'LDT', createdBy: seller.id },
      });
      const v = await createVehicle(org.id, seller.id, {
        brand: 'Dt',
        model: 'Y',
        salePriceCents: 13_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });
      const past = new Date('2020-01-15T12:00:00.000Z');
      await registerSale(
        org.id,
        seller.id,
        baseInput(v.id, seller.id, 12_000_00, {
          customerId: customer.id,
          soldAt: past,
        }),
      );

      const filters = saleFiltersSchema.parse({
        soldAfter: new Date('2020-01-01'),
        soldBefore: new Date('2020-02-01'),
        page: 1,
        pageSize: 20,
      });
      const r = await listSales(org.id, filters);
      expect(r.total).toBeGreaterThanOrEqual(1);
    });

    it('busca por customer name', async () => {
      const org = await createTestOrg('list-srch');
      const seller = await createSeller(org.id, 'ss');
      const t = Date.now();
      const customer = await prisma.customer.create({
        data: {
          organizationId: org.id,
          name: `Cliente Único ${t}`,
          createdBy: seller.id,
        },
      });
      const v = await createVehicle(org.id, seller.id, {
        brand: 'Sr',
        model: 'Z',
        salePriceCents: 14_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });
      await registerSale(
        org.id,
        seller.id,
        baseInput(v.id, seller.id, 13_000_00, { customerId: customer.id }),
      );

      const filters = saleFiltersSchema.parse({
        search: `Único ${t}`,
        page: 1,
        pageSize: 20,
      });
      const r = await listSales(org.id, filters);
      expect(r.items.some((i) => i.customer.name.includes('Único'))).toBe(true);
    });

    it('pagina corretamente', async () => {
      const org = await createTestOrg('list-pg');
      const seller = await createSeller(org.id, 'spg');
      const customer = await prisma.customer.create({
        data: { organizationId: org.id, name: 'PG', createdBy: seller.id },
      });
      for (let i = 0; i < 5; i++) {
        const v = await createVehicle(org.id, seller.id, {
          brand: 'Pg',
          model: `M${i}`,
          salePriceCents: 20_000_00 + i,
          optionals: [],
          status: 'AVAILABLE',
        });
        await registerSale(
          org.id,
          seller.id,
          baseInput(v.id, seller.id, 19_000_00 + i, {
            customerId: customer.id,
          }),
        );
      }

      const p1 = saleFiltersSchema.parse({ page: 1, pageSize: 2 });
      const p2 = saleFiltersSchema.parse({ page: 2, pageSize: 2 });
      const r1 = await listSales(org.id, p1);
      const r2 = await listSales(org.id, p2);
      expect(r1.items.length).toBe(2);
      expect(r2.items.length).toBe(2);
      expect(r1.total).toBeGreaterThanOrEqual(5);
    });
  });
});
