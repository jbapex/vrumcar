'use client';

import type { ReportsData } from '@/modules/reports/reports-service';
import { Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  orgSlug: string;
  data: ReportsData;
  year: number;
  month: number;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function ReportsContent({ orgSlug, data, year, month }: Props) {
  const router = useRouter();

  const handlePeriodChange = (newYear: number, newMonth: number) => {
    router.push(`/${orgSlug}/reports?year=${newYear}&month=${newMonth}`);
  };

  const handleExport = () => {
    window.open(
      `/api/${orgSlug}/reports/export-csv?year=${year}&month=${month}`,
      '_blank',
    );
  };

  const totalLeads = data.funnel.reduce((s, f) => s + f.count, 0);
  const funnelSteps = data.funnel.filter((s) => s.count > 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Análise de funil e conversão
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={month}
            onChange={(e) =>
              handlePeriodChange(year, parseInt(e.target.value, 10))
            }
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) =>
              handlePeriodChange(parseInt(e.target.value, 10), month)
            }
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          >
            {Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i).map(
              (y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ),
            )}
          </select>

          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          >
            <Download className="h-4 w-4" aria-hidden />
            Exportar CSV
          </button>
        </div>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Funil de vendas</h2>
        <p className="mt-1 text-sm text-zinc-500">
          {totalLeads} leads em {MONTH_NAMES[month - 1]} {year}
        </p>

        {totalLeads === 0 ? (
          <p className="mt-8 text-center text-sm text-zinc-500">
            Nenhum lead neste período
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {funnelSteps.map((step) => (
              <div key={step.status}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{step.label}</span>
                  <span className="text-zinc-600">
                    {step.count}{' '}
                    <span className="text-zinc-400">({step.percent}%)</span>
                  </span>
                </div>
                <div className="h-8 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
                  <div
                    className={`flex h-full items-center px-3 text-xs font-semibold text-white ${step.color}`}
                    style={{
                      width: `${Math.max(step.percent, 5)}%`,
                      minWidth: step.count > 0 ? '2.5rem' : 0,
                    }}
                  >
                    {step.count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Conversão por fonte</h2>

        {data.sources.length === 0 ? (
          <p className="mt-8 text-center text-sm text-zinc-500">
            Nenhum lead neste período
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-xs font-medium uppercase text-zinc-500 dark:border-zinc-800">
                  <th className="px-4 py-3">Fonte</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Ganhos</th>
                  <th className="px-4 py-3 text-right">Perdidos</th>
                  <th className="px-4 py-3 text-right">Conversão</th>
                </tr>
              </thead>
              <tbody>
                {data.sources.map((src) => (
                  <tr
                    key={src.source}
                    className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50"
                  >
                    <td className="px-4 py-3 font-medium">{src.label}</td>
                    <td className="px-4 py-3 text-right">{src.total}</td>
                    <td className="px-4 py-3 text-right text-green-700">
                      {src.won}
                    </td>
                    <td className="px-4 py-3 text-right text-red-700">
                      {src.lost}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          src.conversionRate > 30
                            ? 'bg-green-100 text-green-800'
                            : src.conversionRate > 10
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-zinc-100 text-zinc-700'
                        }`}
                      >
                        {src.conversionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
