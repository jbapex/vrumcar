import type { LeadPriority } from '@prisma/client';
import { Flame } from 'lucide-react';

const CONFIG: Record<LeadPriority, { label: string; className: string }> = {
  LOW: { label: 'Baixa', className: 'bg-zinc-100 text-zinc-700' },
  MEDIUM: { label: 'Média', className: 'bg-blue-100 text-blue-700' },
  HIGH: { label: 'Alta', className: 'bg-orange-100 text-orange-700' },
  HOT: { label: 'Quente', className: 'bg-red-100 text-red-700' },
};

export function LeadPriorityBadge({ priority }: { priority: LeadPriority }) {
  const config = CONFIG[priority];
  return (
    <span
      className={`inline-flex h-[1.375rem] items-center gap-0.5 rounded-full px-1.5 text-[0.6875rem] font-medium ${config.className}`}
    >
      {priority === 'HOT' && <Flame className="size-2.5" />}
      {config.label}
    </span>
  );
}
