import { prisma } from '@/lib/db';
import type { TaskPriority, TaskStatus } from '@prisma/client';

export interface TaskFilters {
  status?: TaskStatus;
  assignedToId?: string;
  leadId?: string;
  dueBefore?: Date;
  dueAfter?: Date;
  userId?: string;
  userRole?: string;
}

export async function listTasks(
  organizationId: string,
  filters: TaskFilters = {},
) {
  const where: Record<string, unknown> = {
    organizationId,
    deletedAt: null,
  };

  if (filters.status) where.status = filters.status;
  if (filters.leadId) where.leadId = filters.leadId;
  if (filters.assignedToId) where.assignedToId = filters.assignedToId;

  if (filters.userRole === 'SALES' && filters.userId) {
    where.assignedToId = filters.userId;
  }

  if (filters.dueBefore || filters.dueAfter) {
    where.dueDate = {};
    if (filters.dueBefore) {
      (where.dueDate as Record<string, unknown>).lte = filters.dueBefore;
    }
    if (filters.dueAfter) {
      (where.dueDate as Record<string, unknown>).gte = filters.dueAfter;
    }
  }

  return prisma.task.findMany({
    where,
    include: {
      lead: { select: { id: true, name: true } },
      vehicle: { select: { id: true, brand: true, model: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: [
      { dueDate: { sort: 'asc', nulls: 'last' } },
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
  });
}

export async function createTask(
  organizationId: string,
  data: {
    title: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: Date | null;
    leadId?: string | null;
    vehicleId?: string | null;
    assignedToId?: string | null;
    createdById: string;
  },
) {
  return prisma.task.create({
    data: {
      organizationId,
      title: data.title,
      description: data.description,
      priority: data.priority ?? 'MEDIUM',
      dueDate: data.dueDate,
      leadId: data.leadId,
      vehicleId: data.vehicleId,
      assignedToId: data.assignedToId,
      createdById: data.createdById,
    },
  });
}

export async function toggleTaskStatus(taskId: string, organizationId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, organizationId, deletedAt: null },
  });
  if (!task) throw new Error('Tarefa não encontrada');

  const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';

  return prisma.task.update({
    where: { id: taskId },
    data: {
      status: newStatus,
      completedAt: newStatus === 'COMPLETED' ? new Date() : null,
    },
  });
}

export async function deleteTask(taskId: string, organizationId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, organizationId, deletedAt: null },
  });
  if (!task) throw new Error('Tarefa não encontrada');

  return prisma.task.update({
    where: { id: taskId },
    data: { deletedAt: new Date() },
  });
}
