import { prisma } from '@/lib/db';

export async function getLeadTaskCounts(
  organizationId: string,
  leadIds: (string | null | undefined)[],
): Promise<Map<string, number>> {
  const ids = [...new Set(leadIds.filter((id): id is string => Boolean(id)))];
  if (ids.length === 0) return new Map();

  const rows = await prisma.task.groupBy({
    by: ['leadId'],
    where: {
      organizationId,
      leadId: { in: ids },
      deletedAt: null,
      status: { notIn: ['COMPLETED', 'CANCELLED'] },
    },
    _count: { _all: true },
  });

  return new Map(
    rows
      .filter((row) => row.leadId)
      .map((row) => [row.leadId!, row._count._all]),
  );
}
