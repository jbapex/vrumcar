'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  createAppointment,
  updateAppointmentStatus,
} from '@/modules/appointments/appointment-service';
import type { AppointmentStatus, AppointmentType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

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

export async function createAppointmentAction(
  orgSlug: string,
  data: {
    type: string;
    title: string;
    notes?: string;
    date: string;
    startHour: string;
    endHour: string;
    leadId?: string | null;
    vehicleId?: string | null;
    assignedToId?: string | null;
  },
) {
  const { org, userId } = await getOrgAndUser(orgSlug);

  if (!data.title.trim()) throw new Error('Título é obrigatório');
  if (!data.date || !data.startHour || !data.endHour) {
    throw new Error('Data e horários são obrigatórios');
  }

  const startTime = new Date(`${data.date}T${data.startHour}:00`);
  const endTime = new Date(`${data.date}T${data.endHour}:00`);

  if (endTime <= startTime) {
    throw new Error('Horário de término deve ser após o início');
  }

  await createAppointment(org.id, {
    type: data.type as AppointmentType,
    title: data.title.trim(),
    notes: data.notes?.trim(),
    startTime,
    endTime,
    leadId: data.leadId || null,
    vehicleId: data.vehicleId || null,
    assignedToId: data.assignedToId || userId,
    createdById: userId,
  });

  revalidatePath(`/${orgSlug}/calendar`);
}

export async function updateStatusAction(
  orgSlug: string,
  appointmentId: string,
  status: string,
) {
  const { org } = await getOrgAndUser(orgSlug);
  await updateAppointmentStatus(
    appointmentId,
    org.id,
    status as AppointmentStatus,
  );
  revalidatePath(`/${orgSlug}/calendar`);
}
