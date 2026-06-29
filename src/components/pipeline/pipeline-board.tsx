'use client';

import { moveLeadStatusAction } from '@/app/[orgSlug]/pipeline/actions';
import type {
  PipelineCard as CardType,
  PipelineColumn as ColumnType,
} from '@/modules/pipeline/pipeline-service';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { PipelineCardCompact } from './pipeline-card';
import { PipelineColumn } from './pipeline-column';

interface Props {
  orgSlug: string;
  columns: ColumnType[];
}

export function PipelineBoard({ orgSlug, columns }: Props) {
  const router = useRouter();
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const totalLeads = columns.reduce((s, c) => s + c.cards.length, 0);
  const totalValue = columns.reduce((s, c) => s + c.totalValueCents, 0);

  const statusOptions = columns.map((c) => ({
    status: c.status,
    label: c.label,
  }));

  const allCards = columns.flatMap((c) => c.cards);

  const handleDragStart = (event: DragStartEvent) => {
    const card = allCards.find((c) => c.id === event.active.id);
    setActiveCard(card ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);

    const { active, over } = event;
    if (!over) return;

    const cardId = active.id as string;
    const targetColumnStatus = over.id as string;

    const card = allCards.find((c) => c.id === cardId);
    if (!card) return;

    if (card.status === targetColumnStatus) return;

    const validStatus = columns.some((c) => c.status === targetColumnStatus);
    if (!validStatus) return;

    startTransition(async () => {
      try {
        await moveLeadStatusAction(orgSlug, cardId, targetColumnStatus);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erro ao mover');
      }
    });
  };

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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden p-4">
          <div
            className="flex h-full min-h-0 items-start gap-4"
            style={{ minWidth: `${columns.length * 276}px` }}
          >
            {columns.map((col) => (
              <PipelineColumn
                key={col.status}
                column={col}
                orgSlug={orgSlug}
                allStatuses={statusOptions}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="w-[240px] rotate-2 opacity-90">
              <PipelineCardCompact card={activeCard} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
