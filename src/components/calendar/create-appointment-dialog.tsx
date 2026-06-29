'use client';

import { createAppointmentAction } from '@/app/[orgSlug]/calendar/actions';
import { Loader2, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

const TYPE_LABELS: Record<string, string> = {
  TEST_DRIVE: 'Test Drive',
  VISIT: 'Visita',
  FOLLOW_UP: 'Follow-up',
  INSPECTION: 'Vistoria',
  DELIVERY: 'Entrega',
  OTHER: 'Outro',
};

interface Props {
  orgSlug: string;
  defaultDate: string;
  teamMembers: Array<{ userId: string; name: string }>;
  leads: Array<{ id: string; name: string }>;
  vehicles: Array<{ id: string; label: string }>;
  defaultLeadId?: string;
  defaultVehicleId?: string;
  autoOpen?: boolean;
}

export function CreateAppointmentDialog({
  orgSlug,
  defaultDate,
  teamMembers,
  leads,
  vehicles,
  defaultLeadId,
  defaultVehicleId,
  autoOpen,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState('TEST_DRIVE');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [startHour, setStartHour] = useState('09:00');
  const [endHour, setEndHour] = useState('09:30');
  const [assignedToId, setAssignedToId] = useState('');
  const [leadId, setLeadId] = useState(defaultLeadId ?? '');
  const [vehicleId, setVehicleId] = useState(defaultVehicleId ?? '');

  useEffect(() => {
    if (defaultLeadId) setLeadId(defaultLeadId);
  }, [defaultLeadId]);

  useEffect(() => {
    if (defaultVehicleId) setVehicleId(defaultVehicleId);
  }, [defaultVehicleId]);

  useEffect(() => {
    if (autoOpen) setOpen(true);
  }, [autoOpen]);

  const resetForm = () => {
    setType('TEST_DRIVE');
    setTitle('');
    setNotes('');
    setStartHour('09:00');
    setEndHour('09:30');
    setAssignedToId('');
    setLeadId('');
    setVehicleId('');
    setError(null);
  };

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      try {
        await createAppointmentAction(orgSlug, {
          type,
          title: title || TYPE_LABELS[type] || type,
          notes: notes || undefined,
          date,
          startHour,
          endHour,
          leadId: leadId || null,
          vehicleId: vehicleId || null,
          assignedToId: assignedToId || null,
        });
        setOpen(false);
        resetForm();
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
        onClick={() => {
          setDate(defaultDate);
          setOpen(true);
        }}
        className="flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
      >
        <Plus className="h-4 w-4" />
        Novo agendamento
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
              aria-labelledby="create-appointment-title"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2
                  id="create-appointment-title"
                  className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
                >
                  Novo agendamento
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="apt-type"
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Tipo
                    </label>
                    <select
                      id="apt-type"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    >
                      {Object.entries(TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="apt-title"
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Título
                    </label>
                    <input
                      id="apt-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={TYPE_LABELS[type]}
                      className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="apt-date"
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Data
                  </label>
                  <input
                    id="apt-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="apt-start"
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Início
                    </label>
                    <input
                      id="apt-start"
                      type="time"
                      value={startHour}
                      onChange={(e) => setStartHour(e.target.value)}
                      className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="apt-end"
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Término
                    </label>
                    <input
                      id="apt-end"
                      type="time"
                      value={endHour}
                      onChange={(e) => setEndHour(e.target.value)}
                      className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="apt-assignee"
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Responsável
                    </label>
                    <select
                      id="apt-assignee"
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
                      htmlFor="apt-lead"
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Lead
                    </label>
                    <select
                      id="apt-lead"
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

                <div>
                  <label
                    htmlFor="apt-vehicle"
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Veículo
                  </label>
                  <select
                    id="apt-vehicle"
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <option value="">Nenhum</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="apt-notes"
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Observações
                  </label>
                  <textarea
                    id="apt-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="mt-1 w-full resize-none rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>

                {error ? (
                  <p className="text-sm text-red-600">{error}</p>
                ) : null}

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
                  {isPending ? 'Agendando...' : 'Agendar'}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
