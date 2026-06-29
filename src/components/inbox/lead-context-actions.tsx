'use client';

import {
  Calendar,
  Car,
  CheckSquare,
  Columns3,
  ExternalLink,
  ShoppingCart,
} from 'lucide-react';
import Link from 'next/link';

interface Props {
  orgSlug: string;
  leadId: string;
  vehicleId?: string | null;
  pendingTasks: number;
  upcomingAppointments: number;
}

const ACTION_LINKS = [
  {
    href: (org: string) => `/${org}/pipeline`,
    label: 'Pipeline',
    description: 'Ver no funil de vendas',
    icon: Columns3,
    color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40',
  },
  {
    href: (org: string, leadId: string) =>
      `/${org}/tasks?leadId=${leadId}&new=1`,
    label: 'Nova tarefa',
    description: 'Follow-up ou lembrete',
    icon: CheckSquare,
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40',
  },
  {
    href: (org: string, leadId: string) =>
      `/${org}/calendar?leadId=${leadId}&new=1`,
    label: 'Agendar',
    description: 'Visita ou test drive',
    icon: Calendar,
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40',
  },
  {
    href: (org: string, leadId: string) => `/${org}/leads/${leadId}`,
    label: 'Ficha completa',
    description: 'Histórico e interações',
    icon: ExternalLink,
    color: 'text-zinc-600 bg-zinc-100 dark:bg-zinc-800',
  },
] as const;

export function LeadContextActions({
  orgSlug,
  leadId,
  vehicleId,
  pendingTasks,
  upcomingAppointments,
}: Props) {
  return (
    <div className="space-y-4">
      {(pendingTasks > 0 || upcomingAppointments > 0) && (
        <div className="grid grid-cols-2 gap-2">
          {pendingTasks > 0 ? (
            <Link
              href={`/${orgSlug}/tasks?leadId=${leadId}`}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 transition-colors hover:border-purple-200 hover:bg-purple-50/50 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-purple-900"
            >
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {pendingTasks}
              </p>
              <p className="text-xs text-zinc-500">tarefa(s) pendente(s)</p>
            </Link>
          ) : null}
          {upcomingAppointments > 0 ? (
            <Link
              href={`/${orgSlug}/calendar?leadId=${leadId}`}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 transition-colors hover:border-purple-200 hover:bg-purple-50/50 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-purple-900"
            >
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {upcomingAppointments}
              </p>
              <p className="text-xs text-zinc-500">agendamento(s) próximo(s)</p>
            </Link>
          ) : null}
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
          Ações do CRM
        </p>
        <div className="grid gap-2">
          {ACTION_LINKS.map((action) => {
            const Icon = action.icon;
            const href =
              action.label === 'Pipeline'
                ? action.href(orgSlug)
                : action.href(orgSlug, leadId);

            return (
              <Link
                key={action.label}
                href={href}
                className="flex items-center gap-3 rounded-xl border border-zinc-200 px-3 py-2.5 transition-colors hover:border-purple-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-purple-900 dark:hover:bg-zinc-900/50"
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${action.color}`}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {action.label}
                  </span>
                  <span className="block text-xs text-zinc-500">
                    {action.description}
                  </span>
                </span>
              </Link>
            );
          })}

          {vehicleId ? (
            <Link
              href={`/${orgSlug}/vehicles/${vehicleId}`}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 px-3 py-2.5 transition-colors hover:border-purple-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-purple-900 dark:hover:bg-zinc-900/50"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                <Car className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Veículo de interesse
                </span>
                <span className="block text-xs text-zinc-500">
                  Ver ficha no estoque
                </span>
              </span>
            </Link>
          ) : null}

          <Link
            href={`/${orgSlug}/sales`}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 px-3 py-2.5 transition-colors hover:border-purple-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-purple-900 dark:hover:bg-zinc-900/50"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-950/40">
              <ShoppingCart className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Registrar venda
              </span>
              <span className="block text-xs text-zinc-500">
                Fechar negócio com este lead
              </span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
