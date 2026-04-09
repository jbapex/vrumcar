'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  createCustomer,
  deleteCustomer,
  updateCustomer,
} from '@/modules/customers/service';
import {
  createCustomerSchema,
  updateCustomerSchema,
} from '@/modules/customers/schemas';

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

function parseFormData(raw: Record<string, FormDataEntryValue>) {
  return {
    name: raw.name?.toString() || undefined,
    cpfCnpj: raw.cpfCnpj?.toString() || undefined,
    rg: raw.rg?.toString() || undefined,
    birthDate: (() => {
      const s = raw.birthDate?.toString().trim();
      if (!s) return undefined;
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? undefined : d;
    })(),
    phone: raw.phone?.toString() || undefined,
    phoneSecondary: raw.phoneSecondary?.toString() || undefined,
    email: raw.email?.toString() || undefined,
    addressStreet: raw.addressStreet?.toString() || undefined,
    addressNumber: raw.addressNumber?.toString() || undefined,
    addressComplement: raw.addressComplement?.toString() || undefined,
    addressNeighborhood: raw.addressNeighborhood?.toString() || undefined,
    addressCity: raw.addressCity?.toString() || undefined,
    addressState: raw.addressState?.toString() || undefined,
    addressZip: raw.addressZip?.toString() || undefined,
    occupation: raw.occupation?.toString() || undefined,
    employerName: raw.employerName?.toString() || undefined,
    monthlyIncomeCents: raw.monthlyIncomeReais
      ? Math.round(Number(raw.monthlyIncomeReais) * 100)
      : undefined,
    notes: raw.notes?.toString() || undefined,
  };
}

export async function createCustomerAction(
  orgSlug: string,
  formData: FormData,
) {
  const { org, userId } = await requireOrgAccess(orgSlug);
  const raw = Object.fromEntries(formData.entries());

  const parsed = createCustomerSchema.safeParse(parseFormData(raw));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Dados inválidos');
  }

  const customer = await createCustomer(org.id, userId, parsed.data);
  revalidatePath(`/${orgSlug}/customers`);
  redirect(`/${orgSlug}/customers/${customer.id}`);
}

export async function updateCustomerAction(
  orgSlug: string,
  customerId: string,
  formData: FormData,
) {
  const { org } = await requireOrgAccess(orgSlug);
  const raw = Object.fromEntries(formData.entries());

  const parsed = updateCustomerSchema.safeParse(parseFormData(raw));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Dados inválidos');
  }

  await updateCustomer(org.id, customerId, parsed.data);
  revalidatePath(`/${orgSlug}/customers/${customerId}`);
  revalidatePath(`/${orgSlug}/customers`);
}

export async function deleteCustomerAction(
  orgSlug: string,
  customerId: string,
) {
  const { org } = await requireOrgAccess(orgSlug);
  await deleteCustomer(org.id, customerId);
  revalidatePath(`/${orgSlug}/customers`);
  redirect(`/${orgSlug}/customers`);
}
