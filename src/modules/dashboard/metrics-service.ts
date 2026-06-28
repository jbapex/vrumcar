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

    monthlyInvested,
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

    prisma.$queryRaw<Array<{ total_invested: bigint }>>`
      SELECT COALESCE(
        SUM(v.acquisition_cost_cents + COALESCE(vc.total_costs, 0)),
        0
      )::bigint as total_invested
      FROM sales s
      LEFT JOIN vehicles v ON v.id = s.vehicle_id
      LEFT JOIN (
        SELECT vehicle_id, SUM(amount_cents) as total_costs
        FROM vehicle_costs
        GROUP BY vehicle_id
      ) vc ON vc.vehicle_id = v.id
      WHERE s.organization_id = ${organizationId}
        AND s.status = 'COMPLETED'::"SaleStatus"
        AND s.created_at >= ${startOfMonth}
    `,
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

  const totalInvestedCents = Number(monthlyInvested[0]?.total_invested ?? 0);
  const monthlyRevenueCents = salesValueThisMonth._sum.finalPriceCents ?? 0;
  const monthlyProfitCents = monthlyRevenueCents - totalInvestedCents;
  const monthlyMarginPercent =
    monthlyRevenueCents > 0
      ? Math.round((monthlyProfitCents / monthlyRevenueCents) * 100 * 10) / 10
      : 0;

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
    financial: {
      monthlyProfitCents,
      monthlyMarginPercent,
      monthlyRevenueCents,
      monthlyInvestedCents: totalInvestedCents,
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

/**
 * Dados pra gráficos do dashboard.
 * Separado do getDashboardMetrics pra manter queries limpas.
 */
export async function getDashboardChartData(organizationId: string) {
  const now = new Date();

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const leadsPerDay = await prisma.$queryRaw<
    Array<{ day: string; count: bigint }>
  >`
    SELECT
      TO_CHAR(created_at, 'YYYY-MM-DD') as day,
      COUNT(*)::bigint as count
    FROM leads
    WHERE organization_id = ${organizationId}
      AND deleted_at IS NULL
      AND created_at >= ${thirtyDaysAgo}
    GROUP BY day
    ORDER BY day ASC
  `;

  const leadsChart: Array<{ date: string; label: string; count: number }> = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split('T')[0]!;
    const label = d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
    const found = leadsPerDay.find((r) => r.day === key);
    leadsChart.push({
      date: key,
      label,
      count: found ? Number(found.count) : 0,
    });
  }

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const salesPerMonth = await prisma.$queryRaw<
    Array<{ month: string; count: bigint; total_cents: bigint }>
  >`
    SELECT
      TO_CHAR(created_at, 'YYYY-MM') as month,
      COUNT(*)::bigint as count,
      COALESCE(SUM(final_price_cents), 0)::bigint as total_cents
    FROM sales
    WHERE organization_id = ${organizationId}
      AND status = 'COMPLETED'::"SaleStatus"
      AND created_at >= ${sixMonthsAgo}
    GROUP BY month
    ORDER BY month ASC
  `;

  const salesChart: Array<{
    month: string;
    label: string;
    count: number;
    valueReais: number;
  }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d
      .toLocaleDateString('pt-BR', { month: 'short' })
      .replace('.', '');
    const found = salesPerMonth.find((r) => r.month === key);
    salesChart.push({
      month: key,
      label: label.charAt(0).toUpperCase() + label.slice(1),
      count: found ? Number(found.count) : 0,
      valueReais: found ? Number(found.total_cents) / 100 : 0,
    });
  }

  const recentSales = await prisma.sale.findMany({
    where: {
      organizationId,
      status: 'COMPLETED',
    },
    include: {
      vehicle: { select: { brand: true, model: true, year: true } },
      customer: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const recentLeads = await prisma.lead.findMany({
    where: {
      organizationId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      source: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return {
    leadsChart,
    salesChart,
    recentSales: recentSales.map((s) => ({
      id: s.id,
      vehicle: s.vehicle
        ? `${s.vehicle.brand} ${s.vehicle.model} ${s.vehicle.year ?? ''}`.trim()
        : '—',
      customer: s.customer?.name ?? '—',
      valueCents: s.finalPriceCents,
      date: s.createdAt.toISOString(),
    })),
    recentLeads: recentLeads.map((l) => ({
      id: l.id,
      name: l.name,
      phone: l.phone,
      source: l.source,
      status: l.status,
      date: l.createdAt.toISOString(),
    })),
  };
}

export type DashboardChartData = Awaited<
  ReturnType<typeof getDashboardChartData>
>;
