'use client';

import { createInboxTaskAction } from '@/app/[orgSlug]/inbox/actions';
import { Button } from '@/components/ui/button';
import { CheckSquare, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

const QUICK_TITLES = [
  'Retornar ligação',
  'Enviar proposta',
  'Follow-up WhatsApp',
  'Agendar visita',
] as const;

interface TeamMember {
  userId: string;
  name: string | null;
  email: string;
}

interface Props {
  orgSlug: string;
  conversationId: string;
  leadId: string | null;
  leadName: string | null;
  vehicleId?: string | null;
  teamMembers: TeamMember[];
  currentUserId: string;
  pendingTasks?: number;
  variant?: 'composer' | 'list';
}

function tomorrowDateInput(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function InboxQuickTaskButton({
  orgSlug,
  conversationId,
  leadId,
  leadName,
  vehicleId,
  teamMembers,
  currentUserId,
  pendingTasks = 0,
  variant = 'composer',
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [assignedToId, setAssignedToId] = useState('');

  const resetForm = () => {
    setTitle('');
    setDueDate('');
    setPriority('MEDIUM');
    setAssignedToId('');
    setError(null);
  };

  const openDialog = () => {
    resetForm();
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      setError('Informe o que precisa fazer');
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await createInboxTaskAction(orgSlug, conversationId, {
          title: title.trim(),
          priority,
          dueDate: dueDate || null,
          leadId,
          vehicleId: vehicleId ?? null,
          assignedToId: assignedToId || currentUserId,
        });
        setOpen(false);
        resetForm();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao criar tarefa');
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        title={
          pendingTasks > 0
            ? `Nova tarefa (${pendingTasks} pendente${pendingTasks === 1 ? '' : 's'})`
            : 'Nova tarefa'
        }
        className={
          variant === 'list'
            ? 'relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200/80 bg-white text-zinc-500 shadow-sm transition-colors hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-purple-800 dark:hover:bg-purple-950/40 dark:hover:text-purple-400'
            : 'relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-purple-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-purple-400'
        }
        aria-label="Nova tarefa"
      >
        <CheckSquare className={variant === 'list' ? 'h-4 w-4' : 'h-5 w-5'} />
        {pendingTasks > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-600 px-1 text-[10px] font-bold text-white">
            {pendingTasks > 9 ? '9+' : pendingTasks}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
            }}
            role="presentation"
            aria-hidden
          />
          <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-2xl sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[90vh] sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  Nova tarefa
                </h2>
                {leadName ? (
                  <p className="text-xs text-zinc-500">
                    Vinculada a {leadName}
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500">
                    Sem lead vinculado a esta conversa
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-4 py-4">
              <div className="mb-3 flex flex-wrap gap-1.5">
                {QUICK_TITLES.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTitle(preset)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                      title === preset
                        ? 'border-purple-600 bg-purple-50 text-purple-800 dark:border-purple-500 dark:bg-purple-950/50 dark:text-purple-200'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-purple-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="inbox-task-title"
                    className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                  >
                    O que fazer? *
                  </label>
                  <input
                    id="inbox-task-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={
                      leadName
                        ? `Ex: Ligar para ${leadName.split(' ')[0]}`
                        : 'Ex: Retornar contato'
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="inbox-task-due"
                      className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                    >
                      Prazo
                    </label>
                    <input
                      id="inbox-task-due"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 10)}
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    />
                    {!dueDate ? (
                      <button
                        type="button"
                        onClick={() => setDueDate(tomorrowDateInput())}
                        className="mt-1 text-[11px] font-medium text-purple-700 hover:underline dark:text-purple-400"
                      >
                        Amanhã
                      </button>
                    ) : null}
                  </div>

                  <div>
                    <label
                      htmlFor="inbox-task-priority"
                      className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                    >
                      Prioridade
                    </label>
                    <select
                      id="inbox-task-priority"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    >
                      <option value="LOW">Baixa</option>
                      <option value="MEDIUM">Média</option>
                      <option value="HIGH">Alta</option>
                      <option value="URGENT">Urgente</option>
                    </select>
                  </div>
                </div>

                {teamMembers.length > 0 ? (
                  <div>
                    <label
                      htmlFor="inbox-task-assignee"
                      className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                    >
                      Responsável
                    </label>
                    <select
                      id="inbox-task-assignee"
                      value={assignedToId}
                      onChange={(e) => setAssignedToId(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    >
                      <option value="">Eu mesmo</option>
                      {teamMembers.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.name ?? m.email}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {error ? (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="w-full"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Criar tarefa
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
