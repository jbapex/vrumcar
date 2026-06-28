import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { PAYMENT_METHOD_LABELS } from '@/lib/labels/sales';

export interface FunnelStep {
  status: string;
  label: string;
  count: number;
  percent: number;
  color: string;
}

export interface SourceConversion {
  source: string;
  label: string;
  total: number;
  won: number;
  lost: number;
  conversionRate: number;
}

export interface ReportsData {
  funnel: FunnelStep[];
  sources: SourceConversion[];
  period: { startDate: string; endDate: string };
}

const STATUS_CONFIG: Array<{ status: string; label: string; color: string }> =
  [
    { status: 'NEW', label: 'Novo', color: 'bg-blue-500' },
    { status: 'CONTACTED', label: 'Contatado', color: 'bg-sky-500' },
    { status: 'QUALIFIED', label: 'Qualificado', color: 'bg-amber-500' },
    { status: 'NEGOTIATING', label: 'Negociando', color: 'bg-purple-500' },
    { status: 'WON', label: 'Ganho', color: 'bg-green-500' },
    { status: 'LOST', label: 'Perdido', color: 'bg-red-500' },
  ];

const SOURCE_LABELS: Record<string, string> = {
  WHATSAPP: 'WhatsApp',
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  WEBMOTORS: 'Webmotors',
  OLX: 'OLX',
  ICARROS: 'iCarros',
  MERCADO_LIVRE: 'Mercado Livre',
  WEBSITE: 'Site',
  WALK_IN: 'Presencial',
  PHONE: 'Telefone',
  REFERRAL: 'Indicação',
  OTHER: 'Outro',
};

export async function getReportsData(
  organizationId: string,
  params: {
    startDate: Date;
    endDate: Date;
    userId?: string;
    userRole?: string;
  },
): Promise<ReportsData> {
  const where: Prisma.LeadWhereInput = {
    organizationId,
    deletedAt: null,
    createdAt: {
      gte: params.startDate,
      lte: params.endDate,
    },
  };

  if (params.userRole === 'SALES' && params.userId) {
    where.assignedToId = params.userId;
  }

  const statusCounts = await prisma.lead.groupBy({
    by: ['status'],
    where,
    _count: true,
  });

  const totalLeads = statusCounts.reduce((s, g) => s + g._count, 0);

  const funnel: FunnelStep[] = STATUS_CONFIG.map((cfg) => {
    const found = statusCounts.find((g) => g.status === cfg.status);
    const count = found?._count ?? 0;
    return {
      status: cfg.status,
      label: cfg.label,
      count,
      percent: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0,
      color: cfg.color,
    };
  });

  const sourceCounts = await prisma.lead.groupBy({
    by: ['source', 'status'],
    where,
    _count: true,
  });

  const sourceMap = new Map<
    string,
    { total: number; won: number; lost: number }
  >();
  for (const row of sourceCounts) {
    const src = row.source;
    if (!sourceMap.has(src)) {
      sourceMap.set(src, { total: 0, won: 0, lost: 0 });
    }
    const entry = sourceMap.get(src)!;
    entry.total += row._count;
    if (row.status === 'WON') entry.won += row._count;
    if (row.status === 'LOST') entry.lost += row._count;
  }

  const sources: SourceConversion[] = Array.from(sourceMap.entries())
    .map(([source, data]) => ({
      source,
      label: SOURCE_LABELS[source] ?? source,
      total: data.total,
      won: data.won,
      lost: data.lost,
      conversionRate:
        data.total > 0 ? Math.round((data.won / data.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    funnel,
    sources,
    period: {
      startDate: params.startDate.toISOString(),
      endDate: params.endDate.toISOString(),
    },
  };
}

export async function exportSalesCSV(
  organizationId: string,
  params: {
    startDate: Date;
    endDate: Date;
  },
): Promise<string> {
  const sales = await prisma.sale.findMany({
    where: {
      organizationId,
      status: 'COMPLETED',
      createdAt: {
        gte: params.startDate,
        lte: params.endDate,
      },
    },
    include: {
      vehicle: {
        include: { costs: true },
      },
      customer: { select: { name: true, phone: true } },
      salesPerson: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const headers = [
    'Data',
    'Veículo',
    'Cliente',
    'Telefone',
    'Vendedor',
    'Preço Compra (R$)',
    'Custos (R$)',
    'Preço Venda (R$)',
    'Lucro (R$)',
    'Margem (%)',
    'Forma Pagamento',
  ];

  const rows = sales.map((sale) => {
    const purchaseCents = sale.vehicle?.acquisitionCostCents ?? 0;
    const costsCents =
      sale.vehicle?.costs?.reduce((s, c) => s + c.amountCents, 0) ?? 0;
    const saleCents = sale.finalPriceCents;
    const profitCents = saleCents - purchaseCents - costsCents;
    const margin =
      saleCents > 0
        ? Math.round((profitCents / saleCents) * 100 * 10) / 10
        : 0;

    return [
      new Date(sale.createdAt).toLocaleDateString('pt-BR'),
      sale.vehicle
        ? `${sale.vehicle.brand ?? ''} ${sale.vehicle.model ?? ''} ${sale.vehicle.year ?? ''}`.trim()
        : '',
      sale.customer?.name ?? '',
      sale.customer?.phone ?? '',
      sale.salesPerson?.name ?? '',
      (purchaseCents / 100).toFixed(2),
      (costsCents / 100).toFixed(2),
      (saleCents / 100).toFixed(2),
      (profitCents / 100).toFixed(2),
      margin.toString(),
      PAYMENT_METHOD_LABELS[sale.paymentMethod] ?? sale.paymentMethod,
    ];
  });

  const bom = '\uFEFF';
  const csv =
    bom +
    [
      headers.join(';'),
      ...rows.map((r) =>
        r
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(';'),
      ),
    ].join('\n');

  return csv;
}
