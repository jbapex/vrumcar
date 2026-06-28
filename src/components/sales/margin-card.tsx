import { DollarSign, Minus, TrendingDown, TrendingUp } from 'lucide-react';

interface Props {
  purchasePriceCents: number;
  totalCostsCents: number;
  salePriceCents: number;
}

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function MarginCard({
  purchasePriceCents,
  totalCostsCents,
  salePriceCents,
}: Props) {
  const totalInvested = purchasePriceCents + totalCostsCents;
  const grossProfit = salePriceCents - totalInvested;
  const marginPercent =
    salePriceCents > 0
      ? Math.round((grossProfit / salePriceCents) * 100 * 10) / 10
      : 0;

  const isPositive = grossProfit > 0;
  const isNegative = grossProfit < 0;

  return (
    <div
      className={`rounded-xl border p-5 ${
        isPositive
          ? 'border-green-200 bg-green-50'
          : isNegative
            ? 'border-red-200 bg-red-50'
            : 'border-zinc-200 bg-zinc-50'
      }`}
    >
      <div className="mb-4 flex items-center gap-2">
        <DollarSign
          className={`h-5 w-5 ${
            isPositive
              ? 'text-green-600'
              : isNegative
                ? 'text-red-600'
                : 'text-zinc-600'
          }`}
        />
        <h3 className="text-sm font-semibold">Margem da venda</h3>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-600">Preço de compra</span>
          <span className="font-medium">{formatBRL(purchasePriceCents)}</span>
        </div>
        {totalCostsCents > 0 ? (
          <div className="flex justify-between">
            <span className="text-zinc-600">+ Custos adicionais</span>
            <span className="font-medium">{formatBRL(totalCostsCents)}</span>
          </div>
        ) : null}
        <div className="flex justify-between border-t border-dashed border-zinc-300 pt-2">
          <span className="text-zinc-600">= Total investido</span>
          <span className="font-medium">{formatBRL(totalInvested)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-600">Preço de venda</span>
          <span className="font-medium">{formatBRL(salePriceCents)}</span>
        </div>
        <div
          className={`flex justify-between border-t-2 pt-2 ${
            isPositive
              ? 'border-green-300'
              : isNegative
                ? 'border-red-300'
                : 'border-zinc-300'
          }`}
        >
          <span className="flex items-center gap-1 font-semibold">
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : isNegative ? (
              <TrendingDown className="h-4 w-4 text-red-600" />
            ) : (
              <Minus className="h-4 w-4 text-zinc-500" />
            )}
            Lucro bruto
          </span>
          <span
            className={`text-lg font-bold ${
              isPositive
                ? 'text-green-700'
                : isNegative
                  ? 'text-red-700'
                  : 'text-zinc-700'
            }`}
          >
            {formatBRL(grossProfit)}
          </span>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            marginPercent > 20
              ? 'bg-green-200 text-green-800'
              : marginPercent > 0
                ? 'bg-amber-200 text-amber-800'
                : 'bg-red-200 text-red-800'
          }`}
        >
          Margem: {marginPercent}%
        </span>
      </div>
    </div>
  );
}
