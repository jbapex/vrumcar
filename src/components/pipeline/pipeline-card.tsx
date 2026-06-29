'use client';

import { moveLeadStatusAction } from '@/app/[orgSlug]/pipeline/actions';
import type { PipelineCard as CardType } from '@/modules/pipeline/pipeline-service';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Globe,
  MessageCircle,
  MoreVertical,
  Phone,
  User,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type ReactNode } from 'react';

interface Props {
  card: CardType;
  orgSlug: string;
  allStatuses: Array<{ status: string; label: string }>;
  currentStatus: string;
}

const SOURCE_ICONS: Record<string, ReactNode> = {
  WHATSAPP: <MessageCircle className="h-3 w-3 text-green-600" />,
  PHONE: <Phone className="h-3 w-3 text-blue-600" />,
  WALKIN: <Users className="h-3 w-3 text-amber-600" />,
  WALK_IN: <Users className="h-3 w-3 text-amber-600" />,
  WEBSITE: <Globe className="h-3 w-3 text-purple-600" />,
};

export function PipelineCard({
  card,
  orgSlug,
  allStatuses,
  currentStatus,
}: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentIdx = allStatuses.findIndex((s) => s.status === currentStatus);
  const canMoveForward =
    currentIdx >= 0 &&
    currentIdx < allStatuses.length - 1 &&
    currentStatus !== 'WON' &&
    currentStatus !== 'LOST';
  const canMoveBack =
    currentIdx > 0 &&
    currentStatus !== 'WON' &&
    currentStatus !== 'LOST';

  const handleMove = (newStatus: string) => {
    startTransition(async () => {
      try {
        await moveLeadStatusAction(orgSlug, card.id, newStatus);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erro');
      }
      setMenuOpen(false);
    });
  };

  const formatValue = (cents: number) =>
    (cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    });

  return (
    <div
      className={`group rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-700 dark:bg-zinc-950 ${
        isPending ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <Link href={`/${orgSlug}/leads/${card.id}`} className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900 hover:text-purple-700 dark:text-zinc-100 dark:hover:text-purple-300">
            {card.name}
          </p>
        </Link>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded p-0.5 text-zinc-400 opacity-0 hover:bg-zinc-100 group-hover:opacity-100 dark:hover:bg-zinc-800"
            aria-label="Mover lead"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>

          {menuOpen ? (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setMenuOpen(false);
                }}
                role="presentation"
                aria-hidden
              />
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                <p className="px-3 py-1 text-[10px] font-medium uppercase text-zinc-400">
                  Mover para
                </p>
                {allStatuses
                  .filter((s) => s.status !== currentStatus)
                  .map((s) => (
                    <button
                      key={s.status}
                      type="button"
                      onClick={() => handleMove(s.status)}
                      disabled={isPending}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      {s.label}
                    </button>
                  ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {card.vehicleInterest ? (
        <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
          🚗 {card.vehicleInterest}
        </p>
      ) : null}

      <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        {card.estimatedValueCents && card.estimatedValueCents > 0 ? (
          <span className="flex items-center gap-1 font-medium text-green-700 dark:text-green-400">
            <DollarSign className="h-3 w-3" />
            {formatValue(card.estimatedValueCents)}
          </span>
        ) : null}

        {card.source && SOURCE_ICONS[card.source] ? (
          <span className="flex items-center gap-1">
            {SOURCE_ICONS[card.source]}
          </span>
        ) : null}

        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {card.daysSinceUpdate}d
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between">
        {card.assignedToName ? (
          <span className="flex items-center gap-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
            <User className="h-3 w-3" />
            {card.assignedToName.split(' ')[0]}
          </span>
        ) : (
          <span className="text-xs text-zinc-300 dark:text-zinc-600">
            Sem vendedor
          </span>
        )}

        <div className="flex items-center gap-0.5">
          {canMoveBack && allStatuses[currentIdx - 1] ? (
            <button
              type="button"
              onClick={() => handleMove(allStatuses[currentIdx - 1]!.status)}
              disabled={isPending}
              className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              title={`Voltar para ${allStatuses[currentIdx - 1]!.label}`}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {canMoveForward && allStatuses[currentIdx + 1] ? (
            <button
              type="button"
              onClick={() => handleMove(allStatuses[currentIdx + 1]!.status)}
              disabled={isPending}
              className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              title={`Avançar para ${allStatuses[currentIdx + 1]!.label}`}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
