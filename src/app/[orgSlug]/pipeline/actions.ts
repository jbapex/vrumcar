'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { leadStatusEnum } from '@/modules/leads/schemas';
import type { LeadStatus } from '@prisma/client';

async function requireOrgMembership(orgSlug: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Não autenticado');

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
    throw new Error('Sem acesso');
  }

  return { org, userId: session.user.id, role: org.memberships[0]!.role };
}

export async function moveLeadStatusAction(
  orgSlug: string,
  leadId: string,
  newStatus: string,
) {
  const parsed = leadStatusEnum.safeParse(newStatus);
  if (!parsed.success) {
    throw new Error('Status inválido');
  }

  const { org, userId, role } = await requireOrgMembership(orgSlug);

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, organizationId: org.id, deletedAt: null },
  });
  if (!lead) throw new Error('Lead não encontrado');

  if (role === 'SALES' && lead.assignedToId !== userId) {
    throw new Error('Sem permissão para mover este lead');
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: parsed.data as LeadStatus,
      updatedAt: new Date(),
    },
  });

  revalidatePath(`/${orgSlug}/pipeline`);
  revalidatePath(`/${orgSlug}/leads/${leadId}`);
}

export async function updateLeadEstimatedValueAction(
  orgSlug: string,
  leadId: string,
  valueCents: number | null,
) {
  const { org } = await requireOrgMembership(orgSlug);

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, organizationId: org.id, deletedAt: null },
  });
  if (!lead) throw new Error('Lead não encontrado');

  await prisma.lead.update({
    where: { id: leadId },
    data: { estimatedValueCents: valueCents },
  });

  revalidatePath(`/${orgSlug}/pipeline`);
}
