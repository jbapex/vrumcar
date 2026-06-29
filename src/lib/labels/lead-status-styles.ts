import type { LeadStatus } from '@prisma/client';

export const LEAD_STATUS_STYLES: Record<
  LeadStatus,
  { badge: string; dot: string }
> = {
  NEW: {
    badge:
      'bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300',
    dot: 'bg-sky-500',
  },
  CONTACTED: {
    badge:
      'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  QUALIFIED: {
    badge:
      'bg-cyan-50 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300',
    dot: 'bg-cyan-500',
  },
  VISIT_SCHEDULED: {
    badge:
      'bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300',
    dot: 'bg-purple-500',
  },
  PROPOSAL_SENT: {
    badge:
      'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300',
    dot: 'bg-indigo-500',
  },
  VISITING: {
    badge:
      'bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300',
    dot: 'bg-violet-500',
  },
  NEGOTIATING: {
    badge:
      'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  WON: {
    badge:
      'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  LOST: {
    badge: 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300',
    dot: 'bg-red-500',
  },
  ARCHIVED: {
    badge:
      'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    dot: 'bg-zinc-400',
  },
};
