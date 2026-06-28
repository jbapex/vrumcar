'use client';

import { Check, Copy, Loader2, UserPlus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createInvitationAction } from '@/app/[orgSlug]/settings/actions';

interface Props {
  orgSlug: string;
}

export function InviteMemberDialog({ orgSlug }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('SALES');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await createInvitationAction(orgSlug, { email, role });
        const link = `${window.location.origin}/invite/${result.token}`;
        setInviteLink(link);
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Erro ao criar convite',
        );
      }
    });
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = inviteLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEmail('');
    setRole('SALES');
    setError(null);
    setInviteLink(null);
    setCopied(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
      >
        <UserPlus className="h-4 w-4" />
        Convidar membro
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={handleClose}
            aria-hidden
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="invite-dialog-title"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 id="invite-dialog-title" className="text-lg font-semibold">
                  Convidar membro
                </h2>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {!inviteLink ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vendedor@email.com"
                      className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700">
                      Cargo
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                    >
                      <option value="SALES">Vendedor</option>
                      <option value="MANAGER">Gerente</option>
                      <option value="ADMIN">Administrador</option>
                      <option value="FINANCE">Financeiro</option>
                      <option value="VIEWER">Visualizador</option>
                    </select>
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={isPending || !email.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    {isPending ? 'Criando...' : 'Criar convite'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md bg-green-50 p-4 text-center">
                    <p className="text-sm font-medium text-green-800">
                      Convite criado! Válido por 7 dias.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">
                      Link de convite
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inviteLink}
                        readOnly
                        className="flex-1 rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs text-zinc-600"
                      />
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="flex items-center gap-1 rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-green-600">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copiar
                          </>
                        )}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-zinc-500">
                      Envie este link para {email} pelo WhatsApp.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50"
                  >
                    Fechar
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
