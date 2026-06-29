'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  createTask,
  deleteTask,
  toggleTaskStatus,
} from '@/modules/tasks/task-service';
import type { TaskPriority } from '@prisma/client';

async function getOrgAndUser(orgSlug: string) {
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
  if (!org || org.memberships.length === 0) throw new Error('Sem acesso');

  return { org, userId: session.user.id, role: org.memberships[0]!.role };
}

export async function createTaskAction(
  orgSlug: string,
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
  const { org, userId } = await getOrgAndUser(orgSlug);

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

  revalidatePath(`/${orgSlug}/tasks`);
}

export async function toggleTaskAction(orgSlug: string, taskId: string) {
  const { org } = await getOrgAndUser(orgSlug);
  await toggleTaskStatus(taskId, org.id);
  revalidatePath(`/${orgSlug}/tasks`);
}

export async function deleteTaskAction(orgSlug: string, taskId: string) {
  const { org } = await getOrgAndUser(orgSlug);
  await deleteTask(taskId, org.id);
  revalidatePath(`/${orgSlug}/tasks`);
}
