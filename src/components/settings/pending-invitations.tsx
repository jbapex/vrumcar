'use client';

import { Clock, Copy, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { cancelInvitationAction } from '@/app/[orgSlug]/settings/actions';

interface Invitation {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
  invitedBy: string;
  createdAt: string;
}

interface Props {
  invitations: Invitation[];
  orgSlug: string;
}

function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    SALES: 'Vendedor',
    MANAGER: 'Gerente',
    ADMIN: 'Administrador',
    FINANCE: 'Financeiro',
    VIEWER: 'Visualizador',
  };
  return map[role] ?? role;
}

export function PendingInvitations({ invitations, orgSlug }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (invitations.length === 0) return null;

  const handleCancel = (id: string) => {
    startTransition(async () => {
      try {
        await cancelInvitationAction(orgSlug, id);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erro');
      }
    });
  };

  const handleCopyLink = async (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // silently fail
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-700">
        <Clock className="h-4 w-4" />
        Convites pendentes ({invitations.length})
      </h3>
      <div className="space-y-2">
        {invitations.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{inv.email}</p>
              <p className="text-xs text-zinc-500">
                {getRoleLabel(inv.role)} · Convidado por {inv.invitedBy}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleCopyLink(inv.token)}
                className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600"
                title="Copiar link"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleCancel(inv.id)}
                disabled={isPending}
                className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                title="Cancelar convite"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
