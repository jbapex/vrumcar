'use client';

import { createTaskAction } from '@/app/[orgSlug]/tasks/actions';
import { Loader2, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

interface Props {
  orgSlug: string;
  teamMembers: Array<{ userId: string; name: string }>;
  leads: Array<{ id: string; name: string }>;
}

export function CreateTaskDialog({ orgSlug, teamMembers, leads }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [leadId, setLeadId] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) {
      setError('Título é obrigatório');
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await createTaskAction(orgSlug, {
          title,
          description: description || undefined,
          priority,
          dueDate: dueDate || null,
          assignedToId: assignedToId || null,
          leadId: leadId || null,
        });
        setTitle('');
        setDescription('');
        setPriority('MEDIUM');
        setDueDate('');
        setAssignedToId('');
        setLeadId('');
        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro');
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
      >
        <Plus className="h-4 w-4" />
        Nova tarefa
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
            }}
            role="presentation"
            aria-hidden
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-950"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-task-title"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2
                  id="create-task-title"
                  className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
                >
                  Nova tarefa
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="task-title"
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Título *
                  </label>
                  <input
                    id="task-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Ligar pro João sobre o Civic"
                    className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                    autoFocus
                  />
                </div>

                <div>
                  <label
                    htmlFor="task-description"
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Descrição
                  </label>
                  <textarea
                    id="task-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="mt-1 w-full resize-none rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="task-priority"
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Prioridade
                    </label>
                    <select
                      id="task-priority"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    >
                      <option value="LOW">Baixa</option>
                      <option value="MEDIUM">Média</option>
                      <option value="HIGH">Alta</option>
                      <option value="URGENT">Urgente</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="task-due-date"
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Prazo
                    </label>
                    <input
                      id="task-due-date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="task-assignee"
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Responsável
                    </label>
                    <select
                      id="task-assignee"
                      value={assignedToId}
                      onChange={(e) => setAssignedToId(e.target.value)}
                      className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    >
                      <option value="">Eu mesmo</option>
                      {teamMembers.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="task-lead"
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Lead vinculado
                    </label>
                    <select
                      id="task-lead"
                      value={leadId}
                      onChange={(e) => setLeadId(e.target.value)}
                      className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    >
                      <option value="">Nenhum</option>
                      {leads.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {isPending ? 'Criando...' : 'Criar tarefa'}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
