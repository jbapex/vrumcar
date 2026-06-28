import type { FinancialSummary } from '@/modules/financial/financial-service';
import {
  ArrowDown,
  ArrowUp,
  DollarSign,
  Minus,
  Percent,
  TrendingUp,
} from 'lucide-react';

interface Props {
  orgSlug: string;
  data: FinancialSummary;
}

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function ProfitBadge({ cents }: { cents: number }) {
  if (cents > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-700">
        <ArrowUp className="h-3 w-3" />
        {formatBRL(cents)}
      </span>
    );
  }
  if (cents < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-700">
        <ArrowDown className="h-3 w-3" />
        {formatBRL(cents)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-500">
      <Minus className="h-3 w-3" />
      R$ 0
    </span>
  );
}

function marginBadgeClass(marginPercent: number): string {
  if (marginPercent > 20) return 'bg-green-100 text-green-800';
  if (marginPercent > 0) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
}

export function FinancialContent({ orgSlug, data }: Props) {
  void orgSlug;

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Margem e lucratividade por venda
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <p className="text-xs font-medium text-green-700">Lucro bruto total</p>
          </div>
          <p
            className={`mt-2 text-2xl font-bold ${
              data.totalProfitCents >= 0 ? 'text-green-800' : 'text-red-700'
            }`}
          >
            {formatBRL(data.totalProfitCents)}
          </p>
          <p className="mt-1 text-xs text-green-600">
            {data.totalSales} {data.totalSales === 1 ? 'venda' : 'vendas'}
          </p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <p className="text-xs font-medium text-blue-700">Receita total</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-800">
            {formatBRL(data.totalRevenueCents)}
          </p>
          <p className="mt-1 text-xs text-blue-600">
            Custo total: {formatBRL(data.totalCostCents)}
          </p>
        </div>

        <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
          <div className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-purple-600" />
            <p className="text-xs font-medium text-purple-700">Margem média</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-purple-800">
            {data.avgMarginPercent}%
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2">
            {data.bestDeal ? (
              <TrendingUp className="h-5 w-5 text-amber-600" />
            ) : (
              <Minus className="h-5 w-5 text-amber-600" />
            )}
            <p className="text-xs font-medium text-amber-700">Melhor negócio</p>
          </div>
          <p className="mt-2 text-lg font-bold text-amber-800">
            {data.bestDeal ? formatBRL(data.bestDeal.grossProfitCents) : '—'}
          </p>
          <p className="mt-1 truncate text-xs text-amber-600">
            {data.bestDeal?.vehicleLabel ?? ''}
          </p>
        </div>
      </div>

      {data.sales.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white px-6 py-12 text-center">
          <p className="text-zinc-500">Nenhuma venda registrada.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase text-zinc-500">
                <th className="px-4 py-3">Veículo</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3 text-right">Compra</th>
                <th className="px-4 py-3 text-right">Custos</th>
                <th className="px-4 py-3 text-right">Venda</th>
                <th className="px-4 py-3 text-right">Lucro</th>
                <th className="px-4 py-3 text-right">Margem</th>
              </tr>
            </thead>
            <tbody>
              {data.sales.map((sale) => (
                <tr
                  key={sale.saleId}
                  className="border-b border-zinc-100 hover:bg-zinc-50"
                >
                  <td className="px-4 py-3 font-medium">{sale.vehicleLabel}</td>
                  <td className="px-4 py-3 text-zinc-600">{sale.customerName}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {formatDate(sale.saleDate)}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-600">
                    {formatBRL(sale.purchasePriceCents)}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-600">
                    {sale.totalCostsCents > 0
                      ? formatBRL(sale.totalCostsCents)
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatBRL(sale.salePriceCents)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ProfitBadge cents={sale.grossProfitCents} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${marginBadgeClass(sale.marginPercent)}`}
                    >
                      {sale.marginPercent}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-zinc-300 bg-zinc-50 font-semibold">
                <td className="px-4 py-3" colSpan={3}>
                  Total ({data.totalSales} vendas)
                </td>
                <td className="px-4 py-3 text-right">
                  {formatBRL(
                    data.sales.reduce((s, m) => s + m.purchasePriceCents, 0),
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {formatBRL(
                    data.sales.reduce((s, m) => s + m.totalCostsCents, 0),
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {formatBRL(data.totalRevenueCents)}
                </td>
                <td className="px-4 py-3 text-right">
                  <ProfitBadge cents={data.totalProfitCents} />
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${marginBadgeClass(data.avgMarginPercent)}`}
                  >
                    {data.avgMarginPercent}%
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
