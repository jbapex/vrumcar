import { afterAll, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/db';
import { vehicleFiltersSchema } from '../schemas';
import {
  addVehicleCost,
  calculateMargin,
  createVehicle,
  deleteVehicle,
  getVehicleById,
  isVehicleComplete,
  listVehicles,
  updateVehicle,
} from '../service';

describe('vehicles service', () => {
  const createdOrgIds: string[] = [];

  afterAll(async () => {
    try {
      if (createdOrgIds.length > 0) {
        await prisma.organization.deleteMany({
          where: { id: { in: createdOrgIds } },
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
        slug: `veh-svc-${suffix}-${t}`,
        name: `Loja Veículos ${suffix} ${t}`,
      },
    });
    createdOrgIds.push(org.id);
    return org;
  }

  describe('isVehicleComplete', () => {
    it('retorna false quando falta campo', () => {
      expect(
        isVehicleComplete({
          version: '1.0',
          year: 2020,
          mileageKm: 10000,
          fuelType: 'FLEX',
          transmission: 'MANUAL',
          bodyType: 'HATCH',
          licensePlate: 'ABC1D23',
          exteriorColor: undefined,
        }),
      ).toBe(false);
    });

    it('retorna true quando todos os campos recomendados estão presentes', () => {
      expect(
        isVehicleComplete({
          version: '1.0',
          year: 2020,
          mileageKm: 10000,
          fuelType: 'FLEX',
          transmission: 'MANUAL',
          bodyType: 'HATCH',
          licensePlate: 'ABC1D23',
          exteriorColor: 'Branco',
        }),
      ).toBe(true);
    });
  });

  describe('calculateMargin', () => {
    it('retorna null quando não há custo de aquisição', () => {
      expect(
        calculateMargin({
          salePriceCents: 100_000,
          acquisitionCostCents: null,
          costs: [],
        }),
      ).toBeNull();
    });

    it('calcula margem correta com custo + despesas', () => {
      const r = calculateMargin({
        salePriceCents: 100_000,
        acquisitionCostCents: 50_000,
        costs: [{ amountCents: 10_000 }, { amountCents: 5_000 }],
      });
      expect(r).not.toBeNull();
      expect(r!.marginCents).toBe(35_000);
      expect(r!.marginPercent).toBeCloseTo(53.846, 2);
    });

    it('com margem negativa (vendendo no prejuízo)', () => {
      const r = calculateMargin({
        salePriceCents: 40_000,
        acquisitionCostCents: 50_000,
        costs: [{ amountCents: 10_000 }],
      });
      expect(r).not.toBeNull();
      expect(r!.marginCents).toBe(-20_000);
      expect(r!.marginPercent).toBeLessThan(0);
    });
  });

  describe('createVehicle', () => {
    it('cria veículo com apenas 3 campos obrigatórios', async () => {
      const org = await createTestOrg('minimal');
      const v = await createVehicle(org.id, 'user-1', {
        brand: 'Fiat',
        model: 'Uno',
        salePriceCents: 25_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });
      expect(v.id).toBeDefined();
      expect(v.brand).toBe('Fiat');
      expect(v.model).toBe('Uno');
      expect(v.salePriceCents).toBe(25_000_00);
    });

    it('marca isComplete=false quando faltam recomendados', async () => {
      const org = await createTestOrg('incomplete');
      const v = await createVehicle(org.id, 'user-1', {
        brand: 'VW',
        model: 'Gol',
        salePriceCents: 30_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });
      expect(v.isComplete).toBe(false);
    });

    it('marca isComplete=true quando todos recomendados estão presentes', async () => {
      const org = await createTestOrg('complete');
      const v = await createVehicle(org.id, 'user-1', {
        brand: 'Toyota',
        model: 'Corolla',
        salePriceCents: 90_000_00,
        optionals: [],
        status: 'AVAILABLE',
        version: 'XEi',
        year: 2022,
        mileageKm: 15_000,
        fuelType: 'FLEX',
        transmission: 'AUTOMATIC',
        bodyType: 'SEDAN',
        licensePlate: 'XYZ9A87',
        exteriorColor: 'Prata',
      });
      expect(v.isComplete).toBe(true);
    });
  });

  describe('updateVehicle', () => {
    it('cria entrada no histórico quando preço muda', async () => {
      const org = await createTestOrg('price-hist');
      const v = await createVehicle(org.id, 'u1', {
        brand: 'Honda',
        model: 'Civic',
        salePriceCents: 80_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });
      const before = await prisma.vehiclePriceHistory.count({
        where: { vehicleId: v.id },
      });
      await updateVehicle(org.id, 'u1', v.id, { salePriceCents: 85_000_00 }, 'Ajuste mercado');
      const after = await prisma.vehiclePriceHistory.count({
        where: { vehicleId: v.id },
      });
      expect(after).toBe(before + 1);
      const last = await prisma.vehiclePriceHistory.findFirst({
        where: { vehicleId: v.id },
        orderBy: { changedAt: 'desc' },
      });
      expect(last?.oldPriceCents).toBe(80_000_00);
      expect(last?.newPriceCents).toBe(85_000_00);
    });

    it('NÃO cria histórico quando preço NÃO muda', async () => {
      const org = await createTestOrg('no-price');
      const v = await createVehicle(org.id, 'u1', {
        brand: 'Ford',
        model: 'Ka',
        salePriceCents: 40_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });
      const before = await prisma.vehiclePriceHistory.count({
        where: { vehicleId: v.id },
      });
      await updateVehicle(org.id, 'u1', v.id, { notes: 'só observação' });
      const after = await prisma.vehiclePriceHistory.count({
        where: { vehicleId: v.id },
      });
      expect(after).toBe(before);
    });

    it('lança erro se veículo não existe ou é de outra org', async () => {
      const orgA = await createTestOrg('org-a');
      const orgB = await createTestOrg('org-b');
      const v = await createVehicle(orgA.id, 'u1', {
        brand: 'GM',
        model: 'Onix',
        salePriceCents: 55_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });
      await expect(
        updateVehicle(orgB.id, 'u1', v.id, { salePriceCents: 60_000_00 }),
      ).rejects.toThrow('Vehicle not found');
      await expect(
        updateVehicle(orgA.id, 'u1', 'clxxxxxxxxxxxxxxxxxxxxxx', {
          salePriceCents: 1,
        }),
      ).rejects.toThrow('Vehicle not found');
    });
  });

  describe('listVehicles', () => {
    it('filtra por status', async () => {
      const org = await createTestOrg('filter-status');
      await createVehicle(org.id, 'u1', {
        brand: 'A',
        model: '1',
        salePriceCents: 10_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });
      await createVehicle(org.id, 'u1', {
        brand: 'B',
        model: '2',
        salePriceCents: 20_000_00,
        optionals: [],
        status: 'SOLD',
      });
      const filters = vehicleFiltersSchema.parse({
        status: 'SOLD',
        pageSize: 20,
      });
      const r = await listVehicles(org.id, filters);
      expect(r.items.every((i) => i.status === 'SOLD')).toBe(true);
      expect(r.total).toBeGreaterThanOrEqual(1);
    });

    it('filtra por search em brand/model', async () => {
      const org = await createTestOrg('search');
      await createVehicle(org.id, 'u1', {
        brand: 'MarcaZebra',
        model: 'X',
        salePriceCents: 10_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });
      await createVehicle(org.id, 'u1', {
        brand: 'Outra',
        model: 'Y',
        salePriceCents: 10_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });
      const filters = vehicleFiltersSchema.parse({
        search: 'Zebra',
      });
      const r = await listVehicles(org.id, filters);
      expect(r.items.some((i) => i.brand.includes('Zebra'))).toBe(true);
      expect(r.items.every((i) => i.brand.includes('Zebra'))).toBe(true);
    });

    it('pagina corretamente', async () => {
      const org = await createTestOrg('page');
      for (let i = 0; i < 5; i += 1) {
        await createVehicle(org.id, 'u1', {
          brand: `P${i}`,
          model: 'M',
          salePriceCents: 10_000_00 + i,
          optionals: [],
          status: 'AVAILABLE',
        });
      }
      const p1 = await listVehicles(
        org.id,
        vehicleFiltersSchema.parse({ page: 1, pageSize: 2 }),
      );
      const p2 = await listVehicles(
        org.id,
        vehicleFiltersSchema.parse({ page: 2, pageSize: 2 }),
      );
      expect(p1.items.length).toBe(2);
      expect(p1.total).toBeGreaterThanOrEqual(5);
      expect(p1.totalPages).toBeGreaterThanOrEqual(3);
      expect(p2.items.length).toBe(2);
      const ids1 = new Set(p1.items.map((x) => x.id));
      for (const x of p2.items) {
        expect(ids1.has(x.id)).toBe(false);
      }
    });

    it('não retorna veículos deletados', async () => {
      const org = await createTestOrg('soft');
      const v = await createVehicle(org.id, 'u1', {
        brand: 'Del',
        model: 'Car',
        salePriceCents: 11_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });
      await deleteVehicle(org.id, v.id);
      const r = await listVehicles(
        org.id,
        vehicleFiltersSchema.parse({ search: 'Del' }),
      );
      expect(r.items.find((i) => i.id === v.id)).toBeUndefined();
      const raw = await prisma.vehicle.findUnique({ where: { id: v.id } });
      expect(raw?.deletedAt).not.toBeNull();
    });
  });

  describe('deleteVehicle', () => {
    it('faz soft delete (deletedAt preenchido)', async () => {
      const org = await createTestOrg('del');
      const v = await createVehicle(org.id, 'u1', {
        brand: 'X',
        model: 'Y',
        salePriceCents: 9_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });
      await deleteVehicle(org.id, v.id);
      const again = await prisma.vehicle.findUnique({ where: { id: v.id } });
      expect(again?.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('addVehicleCost', () => {
    it('adiciona custo e retorna', async () => {
      const org = await createTestOrg('cost');
      const v = await createVehicle(org.id, 'u1', {
        brand: 'C',
        model: 'V',
        salePriceCents: 12_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });
      const cost = await addVehicleCost(org.id, 'u1', v.id, {
        type: 'MECHANIC',
        description: 'Revisão',
        amountCents: 500_00,
      });
      expect(cost.amountCents).toBe(500_00);
      expect(cost.vehicleId).toBe(v.id);
    });

    it('lança erro se veículo é de outra org (isolation)', async () => {
      const orgA = await createTestOrg('cost-a');
      const orgB = await createTestOrg('cost-b');
      const v = await createVehicle(orgA.id, 'u1', {
        brand: 'Iso',
        model: 'V',
        salePriceCents: 12_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });
      await expect(
        addVehicleCost(orgB.id, 'u1', v.id, {
          type: 'OTHER',
          description: 'x',
          amountCents: 100,
        }),
      ).rejects.toThrow('Vehicle not found');
    });
  });

  describe('getVehicleById', () => {
    it('retorna veículo com relações quando existe', async () => {
      const org = await createTestOrg('get');
      const v = await createVehicle(org.id, 'u1', {
        brand: 'G',
        model: 'T',
        salePriceCents: 13_000_00,
        optionals: [],
        status: 'AVAILABLE',
      });
      await updateVehicle(org.id, 'u1', v.id, { salePriceCents: 14_000_00 });
      const full = await getVehicleById(org.id, v.id);
      expect(full?.id).toBe(v.id);
      expect(full?.priceHistory.length).toBeGreaterThanOrEqual(1);
    });
  });
});
