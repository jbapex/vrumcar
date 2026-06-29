'use client';

import { PipelineColumn } from '@/components/pipeline/pipeline-column';
import type { PipelineColumn as ColumnType } from '@/modules/pipeline/pipeline-service';

interface Props {
  orgSlug: string;
  columns: ColumnType[];
}

export function PipelineBoard({ orgSlug, columns }: Props) {
  const activeColumns = columns.filter(
    (c) => c.status !== 'WON' && c.status !== 'LOST',
  );
  const wonColumn = columns.find((c) => c.status === 'WON');
  const lostColumn = columns.find((c) => c.status === 'LOST');

  const totalLeads = columns.reduce((s, c) => s + c.cards.length, 0);
  const totalValue = columns.reduce((s, c) => s + c.totalValueCents, 0);

  const statusOptions = columns.map((c) => ({
    status: c.status,
    label: c.label,
  }));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Pipeline
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {totalLeads} leads ·{' '}
            {totalValue > 0
              ? (totalValue / 100).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0,
                })
              : 'R$ 0'}{' '}
            em negociação
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto p-4">
        <div
          className="flex gap-4"
          style={{ minWidth: `${activeColumns.length * 280}px` }}
        >
          {activeColumns.map((col) => (
            <PipelineColumn
              key={col.status}
              column={col}
              orgSlug={orgSlug}
              allStatuses={statusOptions}
            />
          ))}
        </div>

        {(wonColumn || lostColumn) && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {wonColumn && wonColumn.cards.length > 0 ? (
              <PipelineColumn
                column={wonColumn}
                orgSlug={orgSlug}
                allStatuses={statusOptions}
                compact
              />
            ) : null}
            {lostColumn && lostColumn.cards.length > 0 ? (
              <PipelineColumn
                column={lostColumn}
                orgSlug={orgSlug}
                allStatuses={statusOptions}
                compact
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
