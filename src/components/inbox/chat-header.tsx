'use client';

import {
  attendConversationAction,
  resolveConversationAction,
} from '@/app/[orgSlug]/inbox/actions';
import { ContactAvatar } from '@/components/inbox/contact-avatar';
import { ReassignButton } from '@/components/inbox/reassign-button';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatPhone } from '@/lib/format/phone';
import { LEAD_STATUS_LABELS } from '@/lib/labels/leads';
import type { LeadStatus } from '@prisma/client';
import {
  CheckCircle2,
  ExternalLink,
  Info,
  MoreHorizontal,
  UserPlus,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

interface TeamMember {
  userId: string;
  name: string | null;
  email: string;
  role: string;
}

interface Props {
  orgSlug: string;
  conversation: {
    id: string;
    contactName: string | null;
    contactAvatar: string | null;
    phoneNumber: string;
    leadId: string | null;
    lead: { id: string; name: string; status: string } | null;
    channelInstance: { id: string; name: string; status: string };
    assignedToId: string | null;
    assignedTo: { id: string; name: string | null; email: string } | null;
    status: string;
  };
  teamMembers: TeamMember[];
  onOpenContactPanel?: () => void;
}

export function ChatHeader({
  orgSlug,
  conversation,
  teamMembers,
  onOpenContactPanel,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const displayName =
    conversation.contactName?.trim() ||
    formatPhone(conversation.phoneNumber) ||
    conversation.phoneNumber;

  const handleAttend = () => {
    startTransition(async () => {
      try {
        await attendConversationAction(orgSlug, conversation.id);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erro');
      }
    });
  };

  const handleResolve = () => {
    startTransition(async () => {
      try {
        await resolveConversationAction(orgSlug, conversation.id);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erro');
      }
    });
  };

  return (
    <div className="shrink-0 border-b border-zinc-200/80 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onOpenContactPanel}
          className="flex min-w-0 items-center gap-3 rounded-lg p-1 -m-1 text-left transition-colors hover:bg-zinc-50 lg:pointer-events-none lg:hover:bg-transparent dark:hover:bg-zinc-900 lg:dark:hover:bg-transparent"
        >
          <ContactAvatar
            name={conversation.contactName}
            avatarUrl={conversation.contactAvatar}
            size="md"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
                {displayName}
              </p>
              {conversation.lead ? (
                <span className="rounded-md bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                  {LEAD_STATUS_LABELS[
                    conversation.lead.status as LeadStatus
                  ]}
                </span>
              ) : null}
            </div>
            <p className="text-muted-foreground truncate text-xs">
              {formatPhone(conversation.phoneNumber)} ·{' '}
              {conversation.channelInstance.name}
              {conversation.assignedTo
                ? ` · ${conversation.assignedTo.name ?? conversation.assignedTo.email}`
                : ''}
            </p>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          {!conversation.assignedToId ? (
            <Button
              type="button"
              size="sm"
              onClick={handleAttend}
              disabled={isPending}
              className="hidden sm:inline-flex"
            >
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              Atender
            </Button>
          ) : null}

          {conversation.status === 'RESOLVED' ? (
            <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-300">
              Resolvido
            </span>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-background text-foreground shadow-xs hover:bg-muted"
              aria-label="Ações da conversa"
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {!conversation.assignedToId ? (
                <DropdownMenuItem onClick={handleAttend} disabled={isPending}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Atender conversa
                </DropdownMenuItem>
              ) : null}
              {conversation.lead ? (
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/${orgSlug}/leads/${conversation.lead!.id}`)
                  }
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ver lead
                </DropdownMenuItem>
              ) : null}
              {onOpenContactPanel ? (
                <DropdownMenuItem
                  onClick={onOpenContactPanel}
                  className="lg:hidden"
                >
                  <Info className="mr-2 h-4 w-4" />
                  Detalhes do contato
                </DropdownMenuItem>
              ) : null}
              {conversation.assignedToId &&
              conversation.status === 'OPEN' ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleResolve}
                    disabled={isPending}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Encerrar atendimento
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>

          {conversation.assignedToId &&
          conversation.status === 'OPEN' ? (
            <ReassignButton
              orgSlug={orgSlug}
              conversationId={conversation.id}
              currentAssignedId={conversation.assignedToId}
              teamMembers={teamMembers}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
