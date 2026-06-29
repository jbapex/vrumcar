import { prisma } from '@/lib/db';
import type { AppointmentStatus, AppointmentType } from '@prisma/client';

export async function listAppointments(
  organizationId: string,
  params: {
    date?: Date;
    startDate?: Date;
    endDate?: Date;
    assignedToId?: string;
    userId?: string;
    userRole?: string;
  } = {},
) {
  const where: Record<string, unknown> = {
    organizationId,
    cancelledAt: null,
  };

  if (params.date) {
    const dayStart = new Date(params.date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(params.date);
    dayEnd.setHours(23, 59, 59, 999);
    where.startTime = { gte: dayStart, lte: dayEnd };
  } else if (params.startDate && params.endDate) {
    where.startTime = { gte: params.startDate, lte: params.endDate };
  }

  if (params.userRole === 'SALES' && params.userId) {
    where.assignedToId = params.userId;
  } else if (params.assignedToId) {
    where.assignedToId = params.assignedToId;
  }

  return prisma.appointment.findMany({
    where,
    include: {
      lead: { select: { id: true, name: true, phone: true } },
      vehicle: { select: { id: true, brand: true, model: true, year: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
    orderBy: { startTime: 'asc' },
  });
}

export async function checkConflict(
  organizationId: string,
  assignedToId: string,
  startTime: Date,
  endTime: Date,
  excludeId?: string,
): Promise<{ hasConflict: boolean; conflictWith: string | null }> {
  const where: Record<string, unknown> = {
    organizationId,
    assignedToId,
    cancelledAt: null,
    status: { notIn: ['CANCELLED', 'NO_SHOW'] },
    startTime: { lt: endTime },
    endTime: { gt: startTime },
  };

  if (excludeId) {
    where.id = { not: excludeId };
  }

  const conflict = await prisma.appointment.findFirst({
    where,
    select: { id: true, title: true, startTime: true },
  });

  if (conflict) {
    return {
      hasConflict: true,
      conflictWith: `${conflict.title} às ${conflict.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    };
  }

  return { hasConflict: false, conflictWith: null };
}

export async function createAppointment(
  organizationId: string,
  data: {
    type: AppointmentType;
    title: string;
    notes?: string;
    startTime: Date;
    endTime: Date;
    leadId?: string | null;
    vehicleId?: string | null;
    assignedToId: string;
    createdById: string;
  },
) {
  const { hasConflict, conflictWith } = await checkConflict(
    organizationId,
    data.assignedToId,
    data.startTime,
    data.endTime,
  );

  if (hasConflict) {
    throw new Error(`Conflito de horário com: ${conflictWith}`);
  }

  return prisma.appointment.create({
    data: {
      organizationId,
      ...data,
    },
  });
}

export async function updateAppointmentStatus(
  appointmentId: string,
  organizationId: string,
  status: AppointmentStatus,
) {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, organizationId },
  });
  if (!appointment) throw new Error('Agendamento não encontrado');

  const data: Record<string, unknown> = { status };
  if (status === 'CANCELLED') data.cancelledAt = new Date();

  return prisma.appointment.update({
    where: { id: appointmentId },
    data,
  });
}
