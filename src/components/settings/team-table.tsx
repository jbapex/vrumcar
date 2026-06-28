'use client';

import { Crown, Shield, ShieldCheck, User, UserCog } from 'lucide-react';

interface Member {
  membershipId: string;
  userId: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  joinedAt: string;
}

interface Props {
  members: Member[];
  orgSlug: string;
  currentUserId: string;
}

function getRoleInfo(role: string): {
  label: string;
  icon: React.ReactNode;
  className: string;
} {
  const map: Record<
    string,
    { label: string; icon: React.ReactNode; className: string }
  > = {
    OWNER: {
      label: 'Proprietário',
      icon: <Crown className="h-3 w-3" />,
      className: 'bg-amber-100 text-amber-800',
    },
    ADMIN: {
      label: 'Administrador',
      icon: <ShieldCheck className="h-3 w-3" />,
      className: 'bg-purple-100 text-purple-800',
    },
    MANAGER: {
      label: 'Gerente',
      icon: <UserCog className="h-3 w-3" />,
      className: 'bg-blue-100 text-blue-800',
    },
    SALES: {
      label: 'Vendedor',
      icon: <User className="h-3 w-3" />,
      className: 'bg-zinc-100 text-zinc-700',
    },
    FINANCE: {
      label: 'Financeiro',
      icon: <Shield className="h-3 w-3" />,
      className: 'bg-green-100 text-green-700',
    },
    VIEWER: {
      label: 'Visualizador',
      icon: <User className="h-3 w-3" />,
      className: 'bg-zinc-50 text-zinc-500',
    },
  };
  return (
    map[role] ?? {
      label: role,
      icon: <User className="h-3 w-3" />,
      className: 'bg-zinc-100 text-zinc-700',
    }
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function TeamTable({ members, orgSlug, currentUserId }: Props) {
  void orgSlug;

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase text-zinc-500">
            <th className="px-4 py-3">Membro</th>
            <th className="px-4 py-3">Cargo</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Desde</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const roleInfo = getRoleInfo(member.role);
            const isMe = member.userId === currentUserId;

            return (
              <tr
                key={member.membershipId}
                className="border-b border-zinc-100 hover:bg-zinc-50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-sm font-medium text-purple-700">
                      {(member.name ?? member.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {member.name ?? '(sem nome)'}
                        {isMe && (
                          <span className="ml-1 text-xs text-zinc-400">
                            (você)
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {member.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${roleInfo.className}`}
                  >
                    {roleInfo.icon}
                    {roleInfo.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {member.isActive ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Ativo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                      Inativo
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {formatDate(member.joinedAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-xs text-zinc-300">—</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
