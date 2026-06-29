import type { LeadStatus } from '@prisma/client';
import { prisma } from '@/lib/db';

const ACTIVE_LEAD_WHERE = {
  deletedAt: null,
  status: { notIn: ['WON', 'LOST', 'ARCHIVED'] as LeadStatus[] },
} as const;

export type InterestedLeadRow = {
  id: string;
  name: string;
  phone: string | null;
  status: LeadStatus;
  updatedAt: Date;
  assignedTo: { id: string; name: string } | null;
  conversations: Array<{ id: string; status: string }>;
};

export async function countInterestedLeadsByVehicleIds(
  organizationId: string,
  vehicleIds: string[],
): Promise<Record<string, number>> {
  if (vehicleIds.length === 0) return {};

  const grouped = await prisma.lead.groupBy({
    by: ['interestVehicleId'],
    where: {
      organizationId,
      ...ACTIVE_LEAD_WHERE,
      interestVehicleId: { in: vehicleIds },
    },
    _count: { _all: true },
  });

  return Object.fromEntries(
    grouped
      .filter((g) => g.interestVehicleId)
      .map((g) => [g.interestVehicleId!, g._count._all]),
  );
}

export async function countInterestedLeadsForVehicle(
  organizationId: string,
  vehicleId: string,
): Promise<number> {
  return prisma.lead.count({
    where: {
      organizationId,
      interestVehicleId: vehicleId,
      ...ACTIVE_LEAD_WHERE,
    },
  });
}

export async function listInterestedLeadsForVehicle(
  organizationId: string,
  vehicleId: string,
): Promise<InterestedLeadRow[]> {
  return prisma.lead.findMany({
    where: {
      organizationId,
      interestVehicleId: vehicleId,
      ...ACTIVE_LEAD_WHERE,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      status: true,
      updatedAt: true,
      assignedTo: { select: { id: true, name: true } },
      conversations: {
        where: { deletedAt: null },
        select: { id: true, status: true },
        orderBy: { lastMessageAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });
}
