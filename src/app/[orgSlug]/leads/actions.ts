'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { convertLeadToCustomer } from '@/modules/customers/service';
import {
  addInteraction,
  createLead,
  deleteLead,
  findDuplicates,
  updateLead,
} from '@/modules/leads/service';
import {
  addInteractionSchema,
  createLeadSchema,
  updateLeadSchema,
} from '@/modules/leads/schemas';
import type { LeadStatus } from '@prisma/client';

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
  return {
    org,
    userId: session.user.id,
    role: org.memberships[0]!.role,
  };
}

function str(raw: FormDataEntryValue | null | undefined): string | undefined {
  if (raw === null || raw === undefined) return undefined;
  const s = String(raw).trim();
  return s === '' ? undefined : s;
}

/**
 * Busca duplicatas ANTES de criar. Chamada pelo form client-side
 * via useTransition + server action pra mostrar modal de aviso.
 */
export async function checkDuplicatesAction(
  orgSlug: string,
  params: { phone?: string; email?: string; cpf?: string },
) {
  const { org } = await requireOrgAccess(orgSlug);
  const normalized = {
    phone: params.phone?.replace(/\D/g, '') || null,
    email: params.email?.trim().toLowerCase() || null,
    cpf: params.cpf?.replace(/\D/g, '') || null,
  };
  if (!normalized.phone && !normalized.email && !normalized.cpf) {
    return [];
  }
  return findDuplicates(org.id, normalized);
}

export async function createLeadAction(orgSlug: string, formData: FormData) {
  const { org, userId } = await requireOrgAccess(orgSlug);

  const raw = Object.fromEntries(formData.entries());

  const parsed = createLeadSchema.safeParse({
    name: raw.name,
    phone: str(raw.phone),
    email: str(raw.email),
    cpf: str(raw.cpf),
    source: str(raw.source) ?? 'OTHER',
    sourceDetails: str(raw.sourceDetails),
    priority: str(raw.priority) ?? 'MEDIUM',
    assignedToId: str(raw.assignedToId),
    interestVehicleId: str(raw.interestVehicleId),
    interestDescription: str(raw.interestDescription),
    hasTradeIn: raw.hasTradeIn === 'on' || raw.hasTradeIn === 'true',
    tradeInDescription: str(raw.tradeInDescription),
    budgetMinCents: raw.budgetMinReais
      ? Math.round(Number(raw.budgetMinReais) * 100)
      : undefined,
    budgetMaxCents: raw.budgetMaxReais
      ? Math.round(Number(raw.budgetMaxReais) * 100)
      : undefined,
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    throw new Error(firstError?.message ?? 'Dados inválidos');
  }

  const lead = await createLead(org.id, userId, parsed.data);
  revalidatePath(`/${orgSlug}/leads`);
  redirect(`/${orgSlug}/leads/${lead.id}`);
}

export async function updateLeadAction(
  orgSlug: string,
  leadId: string,
  formData: FormData,
) {
  const { org, userId } = await requireOrgAccess(orgSlug);
  const raw = Object.fromEntries(formData.entries());

  const parsed = updateLeadSchema.safeParse({
    name: str(raw.name),
    phone: str(raw.phone),
    email: str(raw.email),
    cpf: str(raw.cpf),
    source: str(raw.source),
    sourceDetails: str(raw.sourceDetails),
    status: str(raw.status),
    priority: str(raw.priority),
    assignedToId: str(raw.assignedToId),
    interestVehicleId: str(raw.interestVehicleId),
    interestDescription: str(raw.interestDescription),
    hasTradeIn:
      raw.hasTradeIn === 'on' || raw.hasTradeIn === 'true' ? true : undefined,
    tradeInDescription: str(raw.tradeInDescription),
    budgetMinCents: raw.budgetMinReais
      ? Math.round(Number(raw.budgetMinReais) * 100)
      : undefined,
    budgetMaxCents: raw.budgetMaxReais
      ? Math.round(Number(raw.budgetMaxReais) * 100)
      : undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Dados inválidos');
  }

  await updateLead(org.id, userId, leadId, parsed.data);
  revalidatePath(`/${orgSlug}/leads/${leadId}`);
  revalidatePath(`/${orgSlug}/leads`);
}

export async function updateLeadStatusAction(
  orgSlug: string,
  leadId: string,
  status: LeadStatus,
) {
  const { org, userId } = await requireOrgAccess(orgSlug);
  await updateLead(org.id, userId, leadId, { status });
  revalidatePath(`/${orgSlug}/leads/${leadId}`);
  revalidatePath(`/${orgSlug}/leads`);
}

export async function deleteLeadAction(orgSlug: string, leadId: string) {
  const { org } = await requireOrgAccess(orgSlug);
  await deleteLead(org.id, leadId);
  revalidatePath(`/${orgSlug}/leads`);
  redirect(`/${orgSlug}/leads`);
}

export async function addInteractionAction(
  orgSlug: string,
  leadId: string,
  formData: FormData,
) {
  const { org, userId } = await requireOrgAccess(orgSlug);
  const raw = Object.fromEntries(formData.entries());

  const parsed = addInteractionSchema.safeParse({
    type: raw.type,
    content: raw.content,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Dados inválidos');
  }

  await addInteraction(org.id, userId, leadId, parsed.data);
  revalidatePath(`/${orgSlug}/leads/${leadId}`);
}

export async function convertToCustomerAction(orgSlug: string, leadId: string) {
  const { org, userId } = await requireOrgAccess(orgSlug);
  const customer = await convertLeadToCustomer(org.id, userId, leadId);
  revalidatePath(`/${orgSlug}/leads/${leadId}`);
  revalidatePath(`/${orgSlug}/customers/${customer.id}`);
  redirect(`/${orgSlug}/customers/${customer.id}`);
}
