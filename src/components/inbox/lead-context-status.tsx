'use client';

import { updateLeadStatusAction } from '@/app/[orgSlug]/leads/actions';
import { LEAD_STATUS_LABELS } from '@/lib/labels/leads';
import type { LeadStatus } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

const OPTIONS = (Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map(
  (value) => ({
    value,
    label: LEAD_STATUS_LABELS[value],
  }),
);

export function LeadContextStatusSelect({
  orgSlug,
  leadId,
  current,
}: {
  orgSlug: string;
  leadId: string;
  current: LeadStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <label
        htmlFor="inbox-lead-status"
        className="mb-1 block text-xs font-medium text-zinc-500"
      >
        Status no funil
      </label>
      <select
        id="inbox-lead-status"
        disabled={pending}
        value={current}
        onChange={(e) => {
          const status = e.target.value as LeadStatus;
          startTransition(async () => {
            await updateLeadStatusAction(orgSlug, leadId, status);
            router.refresh();
          });
        }}
        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
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
