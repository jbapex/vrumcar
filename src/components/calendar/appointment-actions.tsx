'use client';

import { updateStatusAction } from '@/app/[orgSlug]/calendar/actions';
import {
  AlertTriangle,
  Check,
  MoreVertical,
  Play,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type ReactNode } from 'react';

interface Props {
  orgSlug: string;
  appointmentId: string;
  currentStatus: string;
}

const STATUS_ACTIONS: Record<
  string,
  Array<{ status: string; label: string; icon: ReactNode }>
> = {
  SCHEDULED: [
    {
      status: 'CONFIRMED',
      label: 'Confirmar',
      icon: <Check className="h-3 w-3" />,
    },
    {
      status: 'CANCELLED',
      label: 'Cancelar',
      icon: <X className="h-3 w-3" />,
    },
  ],
  CONFIRMED: [
    {
      status: 'IN_PROGRESS',
      label: 'Iniciar',
      icon: <Play className="h-3 w-3" />,
    },
    {
      status: 'NO_SHOW',
      label: 'Não compareceu',
      icon: <AlertTriangle className="h-3 w-3" />,
    },
    {
      status: 'CANCELLED',
      label: 'Cancelar',
      icon: <X className="h-3 w-3" />,
    },
  ],
  IN_PROGRESS: [
    {
      status: 'COMPLETED',
      label: 'Concluir',
      icon: <Check className="h-3 w-3" />,
    },
  ],
};

export function AppointmentActions({
  orgSlug,
  appointmentId,
  currentStatus,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const actions = STATUS_ACTIONS[currentStatus];
  if (!actions || actions.length === 0) return null;

  const handleAction = (newStatus: string) => {
    startTransition(async () => {
      try {
        await updateStatusAction(orgSlug, appointmentId, newStatus);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erro');
      }
      setOpen(false);
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
            }}
            role="presentation"
            aria-hidden
          />
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            {actions.map((action) => (
              <button
                key={action.status}
                type="button"
                onClick={() => handleAction(action.status)}
                disabled={isPending}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800 ${
                  action.status === 'CANCELLED'
                    ? 'text-red-600'
                    : 'text-zinc-700 dark:text-zinc-200'
                }`}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
