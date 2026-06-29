'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  assignConversation,
  markConversationAsRead,
  reassignConversation,
  reactToConversationMessage,
  reopenConversation,
  resolveConversation,
  sendTextMessage,
} from '@/modules/channels/conversation-service';
import { sendTextMessageSchema } from '@/modules/channels/schemas';
import { updateLead } from '@/modules/leads/service';
import { createTask } from '@/modules/tasks/task-service';
import type { LeadPriority, LeadSource, LeadStatus, TaskPriority } from '@prisma/client';

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

export async function sendMessageAction(
  orgSlug: string,
  formData: FormData,
) {
  const { org, userId } = await requireOrgAccess(orgSlug);
  const raw = Object.fromEntries(formData.entries());

  const parsed = sendTextMessageSchema.safeParse({
    conversationId: raw.conversationId,
    text: raw.text,
    replyToMessageId: raw.replyToMessageId?.toString() || null,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Mensagem inválida');
  }

  try {
    await sendTextMessage(org.id, userId, parsed.data);
    revalidatePath(`/${orgSlug}/inbox/${parsed.data.conversationId}`);
    revalidatePath(`/${orgSlug}/inbox`);
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : 'Erro ao enviar mensagem',
    );
  }
}

export async function reactToMessageAction(
  orgSlug: string,
  conversationId: string,
  messageId: string,
  emoji: string,
) {
  const { org, userId } = await requireOrgAccess(orgSlug);

  try {
    await reactToConversationMessage(org.id, userId, {
      conversationId,
      messageId,
      emoji,
    });
    revalidatePath(`/${orgSlug}/inbox/${conversationId}`);
    revalidatePath(`/${orgSlug}/inbox`);
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : 'Erro ao reagir à mensagem',
    );
  }
}

export async function markAsReadAction(
  orgSlug: string,
  conversationId: string,
) {
  const { org } = await requireOrgAccess(orgSlug);
  await markConversationAsRead(org.id, conversationId);
  revalidatePath(`/${orgSlug}/inbox`);
}

export async function updateLeadNotesAction(
  orgSlug: string,
  leadId: string,
  notes: string,
) {
  const { org } = await requireOrgAccess(orgSlug);

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, organizationId: org.id, deletedAt: null },
  });
  if (!lead) {
    throw new Error('Lead não encontrado');
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: { notes: notes || null },
  });

  revalidatePath(`/${orgSlug}/inbox`);
}

export async function attendConversationAction(
  orgSlug: string,
  conversationId: string,
) {
  const { org, userId } = await requireOrgAccess(orgSlug);

  try {
    await assignConversation(org.id, conversationId, userId);
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Erro ao atender');
  }

  revalidatePath(`/${orgSlug}/inbox`);
  revalidatePath(`/${orgSlug}/inbox/${conversationId}`);
}

export async function resolveConversationAction(
  orgSlug: string,
  conversationId: string,
) {
  const { org, userId } = await requireOrgAccess(orgSlug);

  try {
    await resolveConversation(org.id, conversationId, userId);
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Erro ao resolver');
  }

  revalidatePath(`/${orgSlug}/inbox`);
  revalidatePath(`/${orgSlug}/inbox/${conversationId}`);
}

export async function reopenConversationAction(
  orgSlug: string,
  conversationId: string,
) {
  const { org, userId } = await requireOrgAccess(orgSlug);

  try {
    await reopenConversation(org.id, conversationId, userId);
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Erro ao reabrir');
  }

  revalidatePath(`/${orgSlug}/inbox`);
  revalidatePath(`/${orgSlug}/inbox/${conversationId}`);
}

export async function reassignConversationAction(
  orgSlug: string,
  conversationId: string,
  newUserId: string,
) {
  const { org, userId } = await requireOrgAccess(orgSlug);

  try {
    await reassignConversation(org.id, conversationId, newUserId, userId);
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : 'Erro ao reatribuir',
    );
  }

  revalidatePath(`/${orgSlug}/inbox`);
  revalidatePath(`/${orgSlug}/inbox/${conversationId}`);
}

export async function updateLeadInterestAction(
  orgSlug: string,
  leadId: string,
  data: {
    interestVehicleId?: string | null;
    interestDescription?: string | null;
  },
  conversationId?: string,
) {
  const { org } = await requireOrgAccess(orgSlug);

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, organizationId: org.id, deletedAt: null },
  });
  if (!lead) throw new Error('Lead não encontrado');

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      interestVehicleId:
        data.interestVehicleId === undefined
          ? undefined
          : data.interestVehicleId || null,
      interestDescription:
        data.interestDescription === undefined
          ? undefined
          : data.interestDescription?.trim() || null,
    },
  });

  revalidatePath(`/${orgSlug}/inbox`);
  revalidatePath(`/${orgSlug}/leads/${leadId}`);
  revalidatePath(`/${orgSlug}/vehicles`);
  if (conversationId) {
    revalidatePath(`/${orgSlug}/inbox/${conversationId}`);
  }
}

export async function updateLeadProfileAction(
  orgSlug: string,
  leadId: string,
  conversationId: string,
  data: {
    name: string;
    email?: string | null;
    cpf?: string | null;
    birthDate?: string | null;
    status: string;
    source: string;
    priority: string;
    assignedToId?: string | null;
    budgetMinCents?: number | null;
    budgetMaxCents?: number | null;
    estimatedValueCents?: number | null;
    hasTradeIn?: boolean;
    tradeInDescription?: string | null;
  },
) {
  const { org, userId } = await requireOrgAccess(orgSlug);

  if (!data.name.trim()) throw new Error('Nome é obrigatório');

  await updateLead(org.id, userId, leadId, {
    name: data.name.trim(),
    email: data.email,
    cpf: data.cpf,
    birthDate: data.birthDate ? new Date(data.birthDate) : null,
    status: data.status as LeadStatus,
    source: data.source as LeadSource,
    priority: data.priority as LeadPriority,
    assignedToId: data.assignedToId,
    budgetMinCents: data.budgetMinCents,
    budgetMaxCents: data.budgetMaxCents,
    estimatedValueCents: data.estimatedValueCents,
    hasTradeIn: data.hasTradeIn,
    tradeInDescription: data.tradeInDescription,
  });

  revalidatePath(`/${orgSlug}/inbox`);
  revalidatePath(`/${orgSlug}/inbox/${conversationId}`);
  revalidatePath(`/${orgSlug}/leads/${leadId}`);
  revalidatePath(`/${orgSlug}/leads`);
  revalidatePath(`/${orgSlug}/pipeline`);
}

export async function createInboxTaskAction(
  orgSlug: string,
  conversationId: string,
  data: {
    title: string;
    description?: string;
    priority?: string;
    dueDate?: string | null;
    leadId?: string | null;
    vehicleId?: string | null;
    assignedToId?: string | null;
  },
) {
  const { org, userId } = await requireOrgAccess(orgSlug);

  if (!data.title.trim()) throw new Error('Título é obrigatório');

  await createTask(org.id, {
    title: data.title.trim(),
    description: data.description?.trim(),
    priority: (data.priority as TaskPriority) ?? 'MEDIUM',
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    leadId: data.leadId || null,
    vehicleId: data.vehicleId || null,
    assignedToId: data.assignedToId || userId,
    createdById: userId,
  });

  revalidatePath(`/${orgSlug}/inbox`);
  revalidatePath(`/${orgSlug}/inbox/${conversationId}`);
  revalidatePath(`/${orgSlug}/tasks`);
  if (data.leadId) {
    revalidatePath(`/${orgSlug}/leads/${data.leadId}`);
  }
}
