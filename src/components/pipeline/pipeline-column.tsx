'use client';

import { PipelineCard } from '@/components/pipeline/pipeline-card';
import type { PipelineColumn as ColumnType } from '@/modules/pipeline/pipeline-service';

interface Props {
  column: ColumnType;
  orgSlug: string;
  allStatuses: Array<{ status: string; label: string }>;
  compact?: boolean;
}

export function PipelineColumn({
  column,
  orgSlug,
  allStatuses,
  compact,
}: Props) {
  const formatValue = (cents: number) =>
    (cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    });

  return (
    <div
      className={`flex flex-col rounded-xl bg-zinc-50 dark:bg-zinc-900/50 ${
        compact ? '' : 'w-[260px] min-w-[260px]'
      }`}
    >
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${column.color}`} />
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            {column.label}
          </h3>
          <span className="rounded-full bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {column.cards.length}
          </span>
        </div>
        {column.totalValueCents > 0 ? (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {formatValue(column.totalValueCents)}
          </span>
        ) : null}
      </div>

      <div
        className={`space-y-2 px-2 pb-3 ${
          compact ? 'max-h-48 overflow-y-auto' : 'flex-1 overflow-y-auto'
        }`}
        style={compact ? undefined : { maxHeight: 'calc(100vh - 240px)' }}
      >
        {column.cards.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 px-3 py-6 text-center text-xs text-zinc-400 dark:border-zinc-700">
            Nenhum lead
          </div>
        ) : (
          column.cards.map((card) => (
            <PipelineCard
              key={card.id}
              card={card}
              orgSlug={orgSlug}
              allStatuses={allStatuses}
              currentStatus={column.status}
            />
          ))
        )}
      </div>
    </div>
  );
}
