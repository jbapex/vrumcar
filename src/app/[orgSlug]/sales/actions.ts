'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  cancelSale,
  registerSale,
  SaleValidationError,
} from '@/modules/sales/service';
import { cancelSaleSchema, registerSaleSchema } from '@/modules/sales/schemas';

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

function str(v: unknown): string | undefined {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s === '' ? undefined : s;
}

export async function registerSaleAction(
  orgSlug: string,
  formData: FormData,
) {
  const { org, userId } = await requireOrgAccess(orgSlug);
  const raw = Object.fromEntries(formData.entries());

  const finalPriceReais = raw.finalPriceReais;
  const finalPriceCents =
    finalPriceReais != null && String(finalPriceReais).trim() !== ''
      ? Math.round(Number(finalPriceReais) * 100)
      : 0;

  const parsed = registerSaleSchema.safeParse({
    vehicleId: str(raw.vehicleId),
    salesPersonId: str(raw.salesPersonId),
    finalPriceCents,
    paymentMethod: str(raw.paymentMethod),
    leadId: str(raw.leadId),
    customerId: str(raw.customerId),
    paymentNotes: str(raw.paymentNotes),
    hasTradeIn: raw.hasTradeIn === 'on' || raw.hasTradeIn === 'true',
    tradeInBrand: str(raw.tradeInBrand),
    tradeInModel: str(raw.tradeInModel),
    tradeInYear: str(raw.tradeInYear)
      ? Number(raw.tradeInYear)
      : undefined,
    tradeInMileageKm: str(raw.tradeInMileageKm)
      ? Number(raw.tradeInMileageKm)
      : undefined,
    tradeInPlate: str(raw.tradeInPlate),
    tradeInValueCents: str(raw.tradeInValueReais)
      ? Math.round(Number(raw.tradeInValueReais) * 100)
      : undefined,
    tradeInNotes: str(raw.tradeInNotes),
    contractNumber: str(raw.contractNumber),
    notes: str(raw.notes),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Dados inválidos');
  }

  try {
    const sale = await registerSale(org.id, userId, parsed.data);
    revalidatePath(`/${orgSlug}/sales`);
    revalidatePath(`/${orgSlug}/vehicles`);
    revalidatePath(`/${orgSlug}/customers/${sale.customerId}`);
    if (parsed.data.leadId) {
      revalidatePath(`/${orgSlug}/leads/${parsed.data.leadId}`);
      revalidatePath(`/${orgSlug}/leads`);
    }
    redirect(`/${orgSlug}/sales/${sale.id}`);
  } catch (err) {
    if (err instanceof SaleValidationError) {
      throw new Error(err.message);
    }
    throw err;
  }
}

export async function cancelSaleAction(
  orgSlug: string,
  saleId: string,
  formData: FormData,
) {
  const { org, userId } = await requireOrgAccess(orgSlug);
  const raw = Object.fromEntries(formData.entries());

  const parsed = cancelSaleSchema.safeParse({
    reason: str(raw.reason),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Motivo inválido');
  }

  const existing = await prisma.sale.findFirst({
    where: { id: saleId, organizationId: org.id },
    select: { leadId: true, customerId: true },
  });

  try {
    await cancelSale(org.id, userId, saleId, parsed.data.reason);
  } catch (err) {
    if (err instanceof SaleValidationError) {
      throw new Error(err.message);
    }
    throw err;
  }

  revalidatePath(`/${orgSlug}/sales/${saleId}`);
  revalidatePath(`/${orgSlug}/sales`);
  revalidatePath(`/${orgSlug}/vehicles`);
  if (existing?.customerId) {
    revalidatePath(`/${orgSlug}/customers/${existing.customerId}`);
  }
  if (existing?.leadId) {
    revalidatePath(`/${orgSlug}/leads/${existing.leadId}`);
    revalidatePath(`/${orgSlug}/leads`);
  }
}
