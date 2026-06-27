'use client';

import { reassignConversationAction } from '@/app/[orgSlug]/inbox/actions';
import { ArrowRightLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

interface TeamMember {
  userId: string;
  name: string | null;
  email: string;
  role: string;
}

interface Props {
  orgSlug: string;
  conversationId: string;
  currentAssignedId: string | null;
  teamMembers: TeamMember[];
}

export function ReassignButton({
  orgSlug,
  conversationId,
  currentAssignedId,
  teamMembers,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleReassign = (newUserId: string) => {
    startTransition(async () => {
      try {
        await reassignConversationAction(orgSlug, conversationId, newUserId);
        setOpen(false);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erro ao reatribuir');
      }
    });
  };

  const others = teamMembers.filter((m) => m.userId !== currentAssignedId);

  if (others.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        disabled={isPending}
      >
        <ArrowRightLeft className="h-3 w-3" />
        Reatribuir
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
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <p className="px-3 py-1 text-[10px] font-medium uppercase text-zinc-400">
              Atribuir para
            </p>
            {others.map((member) => (
              <button
                key={member.userId}
                type="button"
                onClick={() => handleReassign(member.userId)}
                disabled={isPending}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  {(member.name ?? member.email).charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    {member.name ?? member.email}
                  </p>
                  <p className="truncate text-[10px] text-zinc-400">
                    {member.role}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
