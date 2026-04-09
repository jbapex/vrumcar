'use client';

import type { LeadStatus } from '@prisma/client';
import { useTransition } from 'react';
import { updateLeadStatusAction } from '@/app/[orgSlug]/leads/actions';
import { LEAD_STATUS_LABELS } from '@/lib/labels/leads';

const OPTIONS = (Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map(
  (value) => ({
    value,
    label: LEAD_STATUS_LABELS[value],
  }),
);

export function LeadStatusSelect({
  orgSlug,
  leadId,
  current,
}: {
  orgSlug: string;
  leadId: string;
  current: LeadStatus;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-sm">Mudar status:</span>
      <select
        disabled={pending}
        defaultValue={current}
        onChange={(e) => {
          const v = e.target.value as LeadStatus;
          start(() => {
            void updateLeadStatusAction(orgSlug, leadId, v);
          });
        }}
        className="border-input bg-background h-9 max-w-[200px] rounded-md border px-2 text-sm"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
