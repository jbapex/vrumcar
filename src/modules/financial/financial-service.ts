import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';

export interface SaleMargin {
  saleId: string;
  vehicleId: string;
  vehicleLabel: string;
  customerName: string;
  saleDate: string;
  purchasePriceCents: number;
  totalCostsCents: number;
  salePriceCents: number;
  grossProfitCents: number;
  marginPercent: number;
}

export interface FinancialSummary {
  totalSales: number;
  totalRevenueCents: number;
  totalCostCents: number;
  totalProfitCents: number;
  avgMarginPercent: number;
  bestDeal: SaleMargin | null;
  worstDeal: SaleMargin | null;
  sales: SaleMargin[];
}

/**
 * Margem = preço de venda − (aquisição + custos adicionais do veículo)
 */
export async function getFinancialData(
  organizationId: string,
  params: {
    startDate?: Date;
    endDate?: Date;
  } = {},
): Promise<FinancialSummary> {
  const where: Prisma.SaleWhereInput = {
    organizationId,
    status: 'COMPLETED',
  };

  if (params.startDate || params.endDate) {
    where.createdAt = {};
    if (params.startDate) {
      where.createdAt.gte = params.startDate;
    }
    if (params.endDate) {
      where.createdAt.lte = params.endDate;
    }
  }

  const sales = await prisma.sale.findMany({
    where,
    include: {
      vehicle: {
        include: {
          costs: true,
        },
      },
      customer: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const salesWithMargin: SaleMargin[] = sales.map((sale) => {
    const vehicle = sale.vehicle;

    const purchasePriceCents = vehicle?.acquisitionCostCents ?? 0;

    const totalCostsCents = vehicle?.costs
      ? vehicle.costs.reduce((sum, c) => sum + c.amountCents, 0)
      : 0;

    const salePriceCents = sale.finalPriceCents;
    const totalInvestedCents = purchasePriceCents + totalCostsCents;
    const grossProfitCents = salePriceCents - totalInvestedCents;

    const marginPercent =
      salePriceCents > 0
        ? Math.round((grossProfitCents / salePriceCents) * 100 * 10) / 10
        : 0;

    return {
      saleId: sale.id,
      vehicleId: vehicle?.id ?? '',
      vehicleLabel: vehicle
        ? `${vehicle.brand} ${vehicle.model} ${vehicle.year ?? ''}`.trim()
        : '—',
      customerName: sale.customer?.name ?? '—',
      saleDate: sale.createdAt.toISOString(),
      purchasePriceCents,
      totalCostsCents,
      salePriceCents,
      grossProfitCents,
      marginPercent,
    };
  });

  const totalRevenueCents = salesWithMargin.reduce(
    (s, m) => s + m.salePriceCents,
    0,
  );
  const totalCostCents = salesWithMargin.reduce(
    (s, m) => s + m.purchasePriceCents + m.totalCostsCents,
    0,
  );
  const totalProfitCents = totalRevenueCents - totalCostCents;
  const avgMarginPercent =
    salesWithMargin.length > 0
      ? Math.round(
          (salesWithMargin.reduce((s, m) => s + m.marginPercent, 0) /
            salesWithMargin.length) *
            10,
        ) / 10
      : 0;

  const sorted = [...salesWithMargin].sort(
    (a, b) => b.grossProfitCents - a.grossProfitCents,
  );

  return {
    totalSales: salesWithMargin.length,
    totalRevenueCents,
    totalCostCents,
    totalProfitCents,
    avgMarginPercent,
    bestDeal: sorted[0] ?? null,
    worstDeal: sorted.length > 1 ? sorted[sorted.length - 1]! : null,
    sales: salesWithMargin,
  };
}
