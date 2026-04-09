'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { reaisNumberParaCentavos } from '@/lib/format';
import {
  createVehicle,
  updateVehicle,
  deleteVehicle,
  updateVehicleStatus,
  addVehicleCost,
  removeVehicleCost,
  removeVehiclePhoto,
  setVehiclePhotoCover,
  reorderVehiclePhotos,
} from '@/modules/vehicles/service';
import {
  createVehicleSchema,
  updateVehicleSchema,
  addVehicleCostSchema,
  vehicleStatusEnum,
} from '@/modules/vehicles/schemas';

async function requireOrgAccess(orgSlug: string) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      memberships: {
        where: { userId: session.user.id, isActive: true },
        take: 1,
      },
    },
  });
  if (!org || org.memberships.length === 0) {
    throw new Error('Forbidden');
  }
  return { org, userId: session.user.id };
}

function str(raw: FormDataEntryValue | null | undefined): string | undefined {
  if (raw === null || raw === undefined) return undefined;
  const s = String(raw).trim();
  return s === '' ? undefined : s;
}

function num(raw: FormDataEntryValue | null | undefined): number | undefined {
  const s = str(raw);
  if (s === undefined) return undefined;
  const n = Number(s);
  return Number.isNaN(n) ? undefined : n;
}

export async function createVehicleAction(
  orgSlug: string,
  formData: FormData,
) {
  const { org, userId } = await requireOrgAccess(orgSlug);
  const raw = Object.fromEntries(formData.entries());

  const parsed = createVehicleSchema.safeParse({
    brand: raw.brand,
    model: raw.model,
    salePriceCents: reaisNumberParaCentavos(raw.salePriceReais),
    version: str(raw.version),
    year: num(raw.year),
    modelYear: num(raw.modelYear),
    exteriorColor: str(raw.exteriorColor),
    interiorColor: str(raw.interiorColor),
    mileageKm: num(raw.mileageKm),
    fuelType: str(raw.fuelType),
    transmission: str(raw.transmission),
    bodyType: str(raw.bodyType),
    category: str(raw.category),
    engineSize: str(raw.engineSize),
    doors: num(raw.doors),
    licensePlate: str(raw.licensePlate),
    chassisNumber: str(raw.chassisNumber),
    renavam: str(raw.renavam),
    fipeCode: str(raw.fipeCode),
    description: str(raw.description),
    notes: str(raw.notes),
    acquisitionCostCents: reaisNumberParaCentavos(raw.acquisitionCostReais),
    minPriceCents: reaisNumberParaCentavos(raw.minPriceReais),
    status: str(raw.status) ?? undefined,
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    throw new Error(firstError?.message ?? 'Dados inválidos');
  }

  const vehicle = await createVehicle(org.id, userId, parsed.data);

  revalidatePath(`/${orgSlug}/vehicles`);
  redirect(`/${orgSlug}/vehicles/${vehicle.id}`);
}

export async function updateVehicleAction(
  orgSlug: string,
  vehicleId: string,
  formData: FormData,
) {
  const { org, userId } = await requireOrgAccess(orgSlug);

  const raw = Object.fromEntries(formData.entries());
  const parsed = updateVehicleSchema.safeParse({
    brand: str(raw.brand),
    model: str(raw.model),
    salePriceCents: reaisNumberParaCentavos(raw.salePriceReais),
    version: str(raw.version),
    year: num(raw.year),
    modelYear: num(raw.modelYear),
    exteriorColor: str(raw.exteriorColor),
    interiorColor: str(raw.interiorColor),
    mileageKm: num(raw.mileageKm),
    fuelType: str(raw.fuelType),
    transmission: str(raw.transmission),
    bodyType: str(raw.bodyType),
    category: str(raw.category),
    engineSize: str(raw.engineSize),
    doors: num(raw.doors),
    licensePlate: str(raw.licensePlate),
    chassisNumber: str(raw.chassisNumber),
    renavam: str(raw.renavam),
    fipeCode: str(raw.fipeCode),
    description: str(raw.description),
    notes: str(raw.notes),
    acquisitionCostCents: reaisNumberParaCentavos(raw.acquisitionCostReais),
    minPriceCents: reaisNumberParaCentavos(raw.minPriceReais),
    status: str(raw.status),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Dados inválidos');
  }

  const priceReason = str(raw.priceReason);

  await updateVehicle(
    org.id,
    userId,
    vehicleId,
    parsed.data,
    priceReason,
  );
  revalidatePath(`/${orgSlug}/vehicles/${vehicleId}`);
  revalidatePath(`/${orgSlug}/vehicles`);
}

export async function deleteVehicleAction(orgSlug: string, vehicleId: string) {
  const { org } = await requireOrgAccess(orgSlug);
  await deleteVehicle(org.id, vehicleId);
  revalidatePath(`/${orgSlug}/vehicles`);
  redirect(`/${orgSlug}/vehicles`);
}

export async function updateStatusAction(
  orgSlug: string,
  vehicleId: string,
  status: string,
) {
  const { org, userId } = await requireOrgAccess(orgSlug);
  const parsed = vehicleStatusEnum.parse(status);
  await updateVehicleStatus(org.id, userId, vehicleId, parsed);
  revalidatePath(`/${orgSlug}/vehicles/${vehicleId}`);
  revalidatePath(`/${orgSlug}/vehicles`);
}

export async function addCostAction(
  orgSlug: string,
  vehicleId: string,
  formData: FormData,
) {
  const { org, userId } = await requireOrgAccess(orgSlug);
  const raw = Object.fromEntries(formData.entries());
  const amountCents = reaisNumberParaCentavos(raw.amountReais);
  const parsed = addVehicleCostSchema.safeParse({
    type: raw.type,
    description: raw.description,
    amountCents,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Dados inválidos');
  }
  await addVehicleCost(org.id, userId, vehicleId, parsed.data);
  revalidatePath(`/${orgSlug}/vehicles/${vehicleId}`);
}

export async function removeCostAction(
  orgSlug: string,
  costId: string,
  vehicleId: string,
) {
  const { org } = await requireOrgAccess(orgSlug);
  await removeVehicleCost(org.id, costId);
  revalidatePath(`/${orgSlug}/vehicles/${vehicleId}`);
}

export async function removePhotoAction(
  orgSlug: string,
  photoId: string,
  vehicleId: string,
) {
  const { org } = await requireOrgAccess(orgSlug);
  await removeVehiclePhoto(org.id, photoId);
  revalidatePath(`/${orgSlug}/vehicles/${vehicleId}`);
}

export async function setPhotoCoverAction(
  orgSlug: string,
  photoId: string,
  vehicleId: string,
) {
  const { org } = await requireOrgAccess(orgSlug);
  await setVehiclePhotoCover(org.id, photoId);
  revalidatePath(`/${orgSlug}/vehicles/${vehicleId}`);
}

export async function reorderPhotosAction(
  orgSlug: string,
  vehicleId: string,
  orderedIds: string[],
) {
  const { org } = await requireOrgAccess(orgSlug);
  await reorderVehiclePhotos(org.id, vehicleId, orderedIds);
  revalidatePath(`/${orgSlug}/vehicles/${vehicleId}`);
}
