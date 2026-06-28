'use client';

import {
  updateMemberRoleAction,
  toggleMemberActiveAction,
  removeMemberAction,
} from '@/app/[orgSlug]/settings/actions';
import {
  Crown,
  Loader2,
  MoreVertical,
  Pencil,
  Shield,
  ShieldCheck,
  Trash2,
  User,
  UserCheck,
  UserCog,
  UserX,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLayoutEffect, useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';

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
  currentUserRole: string;
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

function MemberActions({
  member,
  orgSlug,
  currentUserId,
  currentUserRole,
}: {
  member: Member;
  orgSlug: string;
  currentUserId: string;
  currentUserRole: string;
}) {
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [editingRole, setEditingRole] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [isPending, startTransition] = useTransition();

  useLayoutEffect(() => {
    if (!menuOpen || !buttonRef.current) return;

    const updatePosition = () => {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const menuWidth = 160;
      const menuHeight = 128;
      const gap = 4;

      let top = rect.bottom + gap;
      let left = rect.right - menuWidth;

      if (top + menuHeight > window.innerHeight - gap) {
        top = rect.top - menuHeight - gap;
      }
      if (left < gap) left = gap;

      setMenuPosition({ top, left });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [menuOpen]);

  const isMe = member.userId === currentUserId;
  const isOwner = member.role === 'OWNER';
  const canEdit =
    ['OWNER', 'ADMIN'].includes(currentUserRole) && !isMe && !isOwner;

  if (!canEdit) return <span className="text-xs text-zinc-300">—</span>;

  const handleRoleChange = (newRole: string) => {
    startTransition(async () => {
      try {
        await updateMemberRoleAction(orgSlug, member.membershipId, newRole);
        router.refresh();
        setEditingRole(false);
        setMenuOpen(false);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erro');
      }
    });
  };

  const handleToggleActive = () => {
    startTransition(async () => {
      try {
        await toggleMemberActiveAction(orgSlug, member.membershipId);
        router.refresh();
        setMenuOpen(false);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erro');
      }
    });
  };

  const handleRemove = () => {
    startTransition(async () => {
      try {
        await removeMemberAction(orgSlug, member.membershipId);
        router.refresh();
        setConfirmRemove(false);
        setMenuOpen(false);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erro');
      }
    });
  };

  if (editingRole) {
    return (
      <div className="flex items-center gap-1">
        <select
          defaultValue={member.role}
          onChange={(e) => handleRoleChange(e.target.value)}
          disabled={isPending}
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs focus:border-purple-500 focus:outline-none"
        >
          <option value="SALES">Vendedor</option>
          <option value="MANAGER">Gerente</option>
          <option value="ADMIN">Administrador</option>
          <option value="FINANCE">Financeiro</option>
          <option value="VIEWER">Visualizador</option>
        </select>
        {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
        <button
          type="button"
          onClick={() => setEditingRole(false)}
          className="text-xs text-zinc-400 hover:text-zinc-600"
        >
          Cancelar
        </button>
      </div>
    );
  }

  if (confirmRemove) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-600">Remover?</span>
        <button
          type="button"
          onClick={handleRemove}
          disabled={isPending}
          className="rounded-md bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Sim'}
        </button>
        <button
          type="button"
          onClick={() => setConfirmRemove(false)}
          className="text-xs text-zinc-400 hover:text-zinc-600"
        >
          Não
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {menuOpen &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
              aria-hidden
            />
            <div
              className="fixed z-50 min-w-[160px] rounded-md border border-zinc-200 bg-white py-1 shadow-lg"
              style={{
                top: menuPosition.top,
                left: menuPosition.left,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setEditingRole(true);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
              >
                <Pencil className="h-3 w-3" />
                Alterar cargo
              </button>
              <button
                type="button"
                onClick={handleToggleActive}
                disabled={isPending}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
              >
                {member.isActive ? (
                  <>
                    <UserX className="h-3 w-3" /> Desativar
                  </>
                ) : (
                  <>
                    <UserCheck className="h-3 w-3" /> Reativar
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmRemove(true);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3" />
                Remover
              </button>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

export function TeamTable({
  members,
  orgSlug,
  currentUserId,
  currentUserRole,
}: Props) {
  return (
    <div className="rounded-lg border border-zinc-200">
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
                  <MemberActions
                    member={member}
                    orgSlug={orgSlug}
                    currentUserId={currentUserId}
                    currentUserRole={currentUserRole}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
