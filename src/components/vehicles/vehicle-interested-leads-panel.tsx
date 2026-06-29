import type { LeadStatus } from '@prisma/client';
import { LeadStatusBadge } from '@/components/leads/status-badge';
import { formatPhone } from '@/lib/format/phone';
import type { InterestedLeadRow } from '@/modules/leads/vehicle-interest';
import Link from 'next/link';

interface Props {
  orgSlug: string;
  vehicleLabel: string;
  leads: InterestedLeadRow[];
}

export function VehicleInterestedLeadsPanel({
  orgSlug,
  vehicleLabel,
  leads,
}: Props) {
  if (leads.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500">
        Nenhum lead ativo com interesse neste veículo (
        {vehicleLabel}).
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {leads.length}
        </span>{' '}
        {leads.length === 1 ? 'lead interessado' : 'leads interessados'} em{' '}
        <span className="font-medium">{vehicleLabel}</span>
      </p>

      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {leads.map((lead) => {
          const conversation = lead.conversations[0];
          return (
            <li
              key={lead.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <Link
                  href={`/${orgSlug}/leads/${lead.id}`}
                  className="font-medium text-purple-700 hover:underline dark:text-purple-300"
                >
                  {lead.name}
                </Link>
                <p className="text-xs text-zinc-500">
                  {lead.phone ? formatPhone(lead.phone) : 'Sem telefone'}
                  {lead.assignedTo
                    ? ` · ${lead.assignedTo.name.split(' ')[0]}`
                    : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <LeadStatusBadge status={lead.status as LeadStatus} />
                {conversation ? (
                  <Link
                    href={`/${orgSlug}/inbox/${conversation.id}`}
                    className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                  >
                    Atendimento
                  </Link>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
