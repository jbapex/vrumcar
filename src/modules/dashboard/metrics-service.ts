import { prisma } from '@/lib/db';

/**
 * Busca todas as métricas do dashboard de uma vez.
 * Usa Promise.all pra paralelizar as queries.
 */
export async function getDashboardMetrics(organizationId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const [
    vehiclesInStock,
    stockValue,
    reservedCount,
    allVehicleDates,

    leadsThisMonth,
    leadsTotal,
    salesFromLeads,
    hotLeads,
    whatsappLeads,
    firstResponseTimes,

    salesThisMonth,
    salesValueThisMonth,
    tradeInSales,
    cancelledSales,
    salesByUser,

    inboxConversations,
    attendingConversations,
    resolvedToday,
    messagesToday,
    conversationsByUser,
  ] = await Promise.all([
    prisma.vehicle.count({
      where: {
        organizationId,
        status: { in: ['AVAILABLE', 'RESERVED'] },
        deletedAt: null,
      },
    }),

    prisma.vehicle.aggregate({
      where: {
        organizationId,
        status: { in: ['AVAILABLE', 'RESERVED'] },
        deletedAt: null,
      },
      _sum: { salePriceCents: true },
      _avg: { salePriceCents: true },
    }),

    prisma.vehicle.count({
      where: {
        organizationId,
        status: 'RESERVED',
        deletedAt: null,
      },
    }),

    prisma.vehicle.findMany({
      where: {
        organizationId,
        status: { in: ['AVAILABLE', 'RESERVED'] },
        deletedAt: null,
      },
      select: { createdAt: true },
    }),

    prisma.lead.count({
      where: {
        organizationId,
        createdAt: { gte: startOfMonth },
        deletedAt: null,
      },
    }),

    prisma.lead.count({
      where: {
        organizationId,
        deletedAt: null,
      },
    }),

    prisma.lead.count({
      where: {
        organizationId,
        status: 'WON',
        deletedAt: null,
      },
    }),

    prisma.lead.count({
      where: {
        organizationId,
        status: { in: ['QUALIFIED', 'NEGOTIATING'] },
        deletedAt: null,
      },
    }),

    prisma.lead.count({
      where: {
        organizationId,
        source: 'WHATSAPP',
        deletedAt: null,
        createdAt: { gte: startOfMonth },
      },
    }),

    prisma.$queryRaw<Array<{ avg_seconds: number | null }>>`
      SELECT AVG(EXTRACT(EPOCH FROM (first_response.created_at - c.created_at))) as avg_seconds
      FROM conversations c
      INNER JOIN LATERAL (
        SELECT m.created_at
        FROM messages m
        WHERE m.conversation_id = c.id
          AND m.direction = 'OUTBOUND'::message_direction
        ORDER BY m.created_at ASC
        LIMIT 1
      ) first_response ON true
      WHERE c.organization_id = ${organizationId}
        AND c.deleted_at IS NULL
        AND c.created_at >= ${startOfMonth}
    `,

    prisma.sale.count({
      where: {
        organizationId,
        createdAt: { gte: startOfMonth },
        status: 'COMPLETED',
      },
    }),

    prisma.sale.aggregate({
      where: {
        organizationId,
        createdAt: { gte: startOfMonth },
        status: 'COMPLETED',
      },
      _sum: { finalPriceCents: true },
      _avg: { finalPriceCents: true },
    }),

    prisma.sale.count({
      where: {
        organizationId,
        createdAt: { gte: startOfMonth },
        status: 'COMPLETED',
        hasTradeIn: true,
      },
    }),

    prisma.sale.count({
      where: {
        organizationId,
        createdAt: { gte: startOfMonth },
        status: 'CANCELLED',
      },
    }),

    prisma.sale.groupBy({
      by: ['salesPersonId'],
      where: {
        organizationId,
        createdAt: { gte: startOfMonth },
        status: 'COMPLETED',
      },
      _count: true,
      _sum: { finalPriceCents: true },
      orderBy: { _count: { salesPersonId: 'desc' } },
    }),

    prisma.conversation.count({
      where: {
        organizationId,
        assignedToId: null,
        status: { not: 'RESOLVED' },
        deletedAt: null,
      },
    }),

    prisma.conversation.count({
      where: {
        organizationId,
        assignedToId: { not: null },
        status: 'OPEN',
        deletedAt: null,
      },
    }),

    prisma.conversation.count({
      where: {
        organizationId,
        status: 'RESOLVED',
        resolvedAt: { gte: startOfDay },
        deletedAt: null,
      },
    }),

    prisma.message.count({
      where: {
        organizationId,
        createdAt: { gte: startOfDay },
      },
    }),

    prisma.conversation.groupBy({
      by: ['assignedToId'],
      where: {
        organizationId,
        assignedToId: { not: null },
        status: 'OPEN',
        deletedAt: null,
      },
      _count: true,
    }),
  ]);

  const avgDaysInStock =
    allVehicleDates.length > 0
      ? Math.round(
          allVehicleDates.reduce((sum, v) => {
            return (
              sum +
              (now.getTime() - v.createdAt.getTime()) / (1000 * 60 * 60 * 24)
            );
          }, 0) / allVehicleDates.length,
        )
      : 0;

  const conversionRate =
    leadsTotal > 0 ? Math.round((salesFromLeads / leadsTotal) * 100) : 0;

  const tradeInRate =
    salesThisMonth > 0
      ? Math.round((tradeInSales / salesThisMonth) * 100)
      : 0;

  const rawAvg = firstResponseTimes[0]?.avg_seconds;
  const avgResponseMinutes = rawAvg ? Math.round(Number(rawAvg) / 60) : null;

  const userIds = [
    ...salesByUser.map((s) => s.salesPersonId),
    ...conversationsByUser.map((c) => c.assignedToId).filter(Boolean),
  ].filter((id): id is string => !!id);

  const users =
    userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: [...new Set(userIds)] } },
          select: { id: true, name: true, email: true },
        })
      : [];

  const userMap = new Map(users.map((u) => [u.id, u.name ?? u.email]));

  return {
    stock: {
      total: vehiclesInStock,
      valueCents: stockValue._sum.salePriceCents ?? 0,
      avgPriceCents: stockValue._avg.salePriceCents
        ? Math.round(stockValue._avg.salePriceCents)
        : 0,
      avgDaysInStock,
      reserved: reservedCount,
    },
    leads: {
      newThisMonth: leadsThisMonth,
      conversionRate,
      hot: hotLeads,
      fromWhatsApp: whatsappLeads,
      avgResponseMinutes,
    },
    sales: {
      countThisMonth: salesThisMonth,
      valueCents: salesValueThisMonth._sum.finalPriceCents ?? 0,
      avgTicketCents: salesValueThisMonth._avg.finalPriceCents
        ? Math.round(salesValueThisMonth._avg.finalPriceCents)
        : 0,
      tradeInRate,
      cancelled: cancelledSales,
      ranking: salesByUser.map((s) => ({
        name: userMap.get(s.salesPersonId) ?? 'Desconhecido',
        count: s._count,
        valueCents: s._sum.finalPriceCents ?? 0,
      })),
    },
    whatsapp: {
      inbox: inboxConversations,
      attending: attendingConversations,
      resolvedToday,
      messagesToday,
      byVendor: conversationsByUser.map((c) => ({
        name: c.assignedToId ? (userMap.get(c.assignedToId) ?? '?') : '?',
        count: c._count,
      })),
    },
  };
}

export type DashboardMetrics = Awaited<ReturnType<typeof getDashboardMetrics>>;
