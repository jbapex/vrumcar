import type { Prisma, Vehicle, VehicleCost } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getTenantPrisma } from '@/lib/db/tenant';
import {
  uploadBuffer,
  deleteObject,
  generateStorageKey,
} from '@/lib/storage/upload';
import type {
  CreateVehicleInput,
  UpdateVehicleInput,
  VehicleFilters,
  AddVehicleCostInput,
} from './schemas';

function omitUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).filter(
      ([, v]) => v !== undefined,
    ),
  ) as Partial<T>;
}

/**
 * Calcula se o cadastro do veículo está "completo" — tem todos os
 * campos importantes preenchidos pra ser publicado em portais.
 *
 * Obrigatórios mínimos já foram validados pelo Zod. Aqui a gente
 * checa se os campos RECOMENDADOS também estão presentes.
 */
export function isVehicleComplete(vehicle: Partial<Vehicle>): boolean {
  const required = [
    vehicle.version,
    vehicle.year,
    vehicle.mileageKm,
    vehicle.fuelType,
    vehicle.transmission,
    vehicle.bodyType,
    vehicle.licensePlate,
    vehicle.exteriorColor,
  ];
  return required.every(
    (field) =>
      field !== null && field !== undefined && field !== '',
  );
}

/**
 * Calcula a margem estimada de lucro do veículo.
 * Retorna null se não houver custo de aquisição cadastrado.
 */
export function calculateMargin(vehicle: {
  salePriceCents: number;
  acquisitionCostCents: number | null;
  costs?: { amountCents: number }[];
}): { marginCents: number; marginPercent: number } | null {
  if (vehicle.acquisitionCostCents == null) return null;

  const totalCosts =
    vehicle.acquisitionCostCents +
    (vehicle.costs?.reduce((sum, c) => sum + c.amountCents, 0) ?? 0);

  const marginCents = vehicle.salePriceCents - totalCosts;
  const marginPercent =
    totalCosts > 0 ? (marginCents / totalCosts) * 100 : 0;

  return { marginCents, marginPercent };
}

/**
 * Cria um novo veículo no estoque.
 */
export async function createVehicle(
  organizationId: string,
  userId: string,
  input: CreateVehicleInput,
): Promise<Vehicle> {
  const db = getTenantPrisma(organizationId);

  return db.vehicle.create({
    data: {
      ...input,
      organizationId,
      isComplete: isVehicleComplete(input as Partial<Vehicle>),
      createdBy: userId,
      updatedBy: userId,
    },
  });
}

/**
 * Atualiza um veículo. Se o preço mudar, cria entrada no histórico.
 */
export async function updateVehicle(
  organizationId: string,
  userId: string,
  vehicleId: string,
  input: UpdateVehicleInput,
  reason?: string,
): Promise<Vehicle> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.vehicle.findFirst({
      where: { id: vehicleId, organizationId, deletedAt: null },
    });

    if (!existing) {
      throw new Error('Vehicle not found');
    }

    const patch = omitUndefined(input) as UpdateVehicleInput;

    if (
      patch.salePriceCents !== undefined &&
      patch.salePriceCents !== existing.salePriceCents
    ) {
      await tx.vehiclePriceHistory.create({
        data: {
          organizationId,
          vehicleId,
          oldPriceCents: existing.salePriceCents,
          newPriceCents: patch.salePriceCents,
          reason: reason ?? null,
          changedBy: userId,
        },
      });
    }

    const merged = { ...existing, ...patch };

    return tx.vehicle.update({
      where: { id: vehicleId },
      data: {
        ...patch,
        isComplete: isVehicleComplete(merged as Partial<Vehicle>),
        updatedBy: userId,
      },
    });
  });
}

/**
 * Soft delete: marca deletedAt em vez de remover do banco.
 */
export async function deleteVehicle(
  organizationId: string,
  vehicleId: string,
): Promise<void> {
  const db = getTenantPrisma(organizationId);
  await db.vehicle.update({
    where: { id: vehicleId },
    data: { deletedAt: new Date() },
  });
}

/**
 * Busca um veículo por ID (com fotos, custos e histórico de preço).
 */
export async function getVehicleById(
  organizationId: string,
  vehicleId: string,
) {
  const db = getTenantPrisma(organizationId);
  return db.vehicle.findFirst({
    where: { id: vehicleId, deletedAt: null },
    include: {
      photos: { orderBy: { order: 'asc' } },
      costs: { orderBy: { occurredAt: 'desc' } },
      priceHistory: { orderBy: { changedAt: 'desc' }, take: 20 },
    },
  });
}

/**
 * Lista veículos com filtros, ordenação e paginação.
 */
export async function listVehicles(
  organizationId: string,
  filters: VehicleFilters,
) {
  const db = getTenantPrisma(organizationId);

  const where: Prisma.VehicleWhereInput = {
    deletedAt: null,
  };

  if (filters.search) {
    where.OR = [
      { brand: { contains: filters.search, mode: 'insensitive' } },
      { model: { contains: filters.search, mode: 'insensitive' } },
      { version: { contains: filters.search, mode: 'insensitive' } },
      { licensePlate: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.status) where.status = filters.status;
  if (filters.brand) where.brand = filters.brand;

  if (filters.yearMin != null || filters.yearMax != null) {
    where.year = {};
    if (filters.yearMin != null) where.year.gte = filters.yearMin;
    if (filters.yearMax != null) where.year.lte = filters.yearMax;
  }

  if (filters.priceMin != null || filters.priceMax != null) {
    where.salePriceCents = {};
    if (filters.priceMin != null) where.salePriceCents.gte = filters.priceMin;
    if (filters.priceMax != null) where.salePriceCents.lte = filters.priceMax;
  }

  const [total, items] = await Promise.all([
    db.vehicle.count({ where }),
    db.vehicle.findMany({
      where,
      include: {
        photos: {
          where: { isCover: true },
          take: 1,
        },
        _count: { select: { photos: true } },
      },
      orderBy: { [filters.orderBy]: filters.orderDir },
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

/**
 * Adiciona um custo ao veículo (mecânica, transferência, etc).
 */
export async function addVehicleCost(
  organizationId: string,
  userId: string,
  vehicleId: string,
  input: AddVehicleCostInput,
): Promise<VehicleCost> {
  const db = getTenantPrisma(organizationId);

  const vehicle = await db.vehicle.findFirst({
    where: { id: vehicleId, deletedAt: null },
  });

  if (!vehicle) {
    throw new Error('Vehicle not found');
  }

  return db.vehicleCost.create({
    data: {
      organizationId,
      vehicleId,
      type: input.type,
      description: input.description,
      amountCents: input.amountCents,
      occurredAt: input.occurredAt ?? new Date(),
      createdBy: userId,
    },
  });
}

/**
 * Remove um custo do veículo.
 */
export async function removeVehicleCost(
  organizationId: string,
  costId: string,
): Promise<void> {
  const db = getTenantPrisma(organizationId);
  await db.vehicleCost.delete({ where: { id: costId } });
}

/**
 * Atualiza o status do veículo.
 */
export async function updateVehicleStatus(
  organizationId: string,
  userId: string,
  vehicleId: string,
  status: Vehicle['status'],
): Promise<Vehicle> {
  const db = getTenantPrisma(organizationId);
  return db.vehicle.update({
    where: { id: vehicleId },
    data: { status, updatedBy: userId },
  });
}

// ========== FOTOS ==========

export async function addVehiclePhoto(
  organizationId: string,
  vehicleId: string,
  file: {
    buffer: Buffer;
    mimeType: string;
    originalName: string;
    sizeBytes: number;
  },
) {
  const db = getTenantPrisma(organizationId);

  const vehicle = await db.vehicle.findFirst({
    where: { id: vehicleId, deletedAt: null },
  });
  if (!vehicle) throw new Error('Vehicle not found');

  const key = generateStorageKey({
    organizationId,
    vehicleId,
    originalName: file.originalName,
  });
  const { url } = await uploadBuffer({
    key,
    buffer: file.buffer,
    contentType: file.mimeType,
  });

  const last = await db.vehiclePhoto.findFirst({
    where: { vehicleId },
    orderBy: { order: 'desc' },
  });
  const nextOrder = (last?.order ?? -1) + 1;

  const countExisting = await db.vehiclePhoto.count({ where: { vehicleId } });
  const isCover = countExisting === 0;

  return db.vehiclePhoto.create({
    data: {
      organizationId,
      vehicleId,
      url,
      storageKey: key,
      order: nextOrder,
      isCover,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
    },
  });
}

export async function removeVehiclePhoto(
  organizationId: string,
  photoId: string,
) {
  const db = getTenantPrisma(organizationId);

  const photo = await db.vehiclePhoto.findFirst({ where: { id: photoId } });
  if (!photo) throw new Error('Photo not found');

  try {
    await deleteObject(photo.storageKey);
  } catch (err) {
    console.error('[storage] Failed to delete object:', err);
  }

  await db.vehiclePhoto.delete({ where: { id: photoId } });

  if (photo.isCover) {
    const next = await db.vehiclePhoto.findFirst({
      where: { vehicleId: photo.vehicleId },
      orderBy: { order: 'asc' },
    });
    if (next) {
      await db.vehiclePhoto.update({
        where: { id: next.id },
        data: { isCover: true },
      });
    }
  }
}

export async function setVehiclePhotoCover(
  organizationId: string,
  photoId: string,
) {
  const db = getTenantPrisma(organizationId);

  const photo = await db.vehiclePhoto.findFirst({ where: { id: photoId } });
  if (!photo) throw new Error('Photo not found');

  return prisma.$transaction(async (tx) => {
    await tx.vehiclePhoto.updateMany({
      where: { vehicleId: photo.vehicleId, organizationId },
      data: { isCover: false },
    });
    return tx.vehiclePhoto.update({
      where: { id: photoId },
      data: { isCover: true },
    });
  });
}

export async function reorderVehiclePhotos(
  organizationId: string,
  vehicleId: string,
  orderedIds: string[],
): Promise<void> {
  const db = getTenantPrisma(organizationId);

  const photos = await db.vehiclePhoto.findMany({
    where: { vehicleId, id: { in: orderedIds } },
  });
  if (photos.length !== orderedIds.length) {
    throw new Error('Some photos not found');
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.vehiclePhoto.update({
        where: { id },
        data: { order: index },
      }),
    ),
  );
}
