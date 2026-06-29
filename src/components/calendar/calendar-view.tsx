'use client';

import { AppointmentActions } from '@/components/calendar/appointment-actions';
import { CreateAppointmentDialog } from '@/components/calendar/create-appointment-dialog';
import {
  Car,
  ChevronLeft,
  ChevronRight,
  Clock,
  Phone,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Appointment {
  id: string;
  type: string;
  title: string;
  notes: string | null;
  startTime: string;
  endTime: string;
  status: string;
  lead: { id: string; name: string; phone: string | null } | null;
  vehicle: { id: string; brand: string; model: string; year: number | null } | null;
  assignedTo: { id: string; name: string | null; email: string } | null;
}

interface Props {
  orgSlug: string;
  appointments: Appointment[];
  selectedDate: string;
  weekStart: string;
  teamMembers: Array<{ userId: string; name: string }>;
  leads: Array<{ id: string; name: string }>;
  vehicles: Array<{ id: string; label: string }>;
  defaultLeadId?: string;
  defaultVehicleId?: string;
  autoOpenAppointment?: boolean;
}

const TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  TEST_DRIVE: { label: 'Test Drive', emoji: '🚗' },
  VISIT: { label: 'Visita', emoji: '🏠' },
  FOLLOW_UP: { label: 'Follow-up', emoji: '📞' },
  INSPECTION: { label: 'Vistoria', emoji: '🔍' },
  DELIVERY: { label: 'Entrega', emoji: '🔑' },
  OTHER: { label: 'Outro', emoji: '📋' },
};

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: 'border-l-blue-500',
  CONFIRMED: 'border-l-green-500',
  IN_PROGRESS: 'border-l-amber-500',
  COMPLETED: 'border-l-green-700 opacity-60',
  NO_SHOW: 'border-l-red-500 opacity-60',
  CANCELLED: 'border-l-zinc-400 opacity-40',
};

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CalendarView({
  orgSlug,
  appointments,
  selectedDate,
  weekStart,
  teamMembers,
  leads,
  vehicles,
  defaultLeadId,
  defaultVehicleId,
  autoOpenAppointment,
}: Props) {
  const router = useRouter();

  const selected = new Date(`${selectedDate}T12:00:00`);
  const weekStartDate = new Date(`${weekStart}T12:00:00`);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  const navigateWeek = (delta: number) => {
    const newDate = new Date(selected);
    newDate.setDate(newDate.getDate() + delta * 7);
    router.push(
      `/${orgSlug}/calendar?date=${newDate.toISOString().split('T')[0]}`,
    );
  };

  const selectDay = (date: Date) => {
    router.push(
      `/${orgSlug}/calendar?date=${date.toISOString().split('T')[0]}`,
    );
  };

  const isToday = (d: Date) => {
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  const isSelected = (d: Date) => {
    return (
      d.getFullYear() === selected.getFullYear() &&
      d.getMonth() === selected.getMonth() &&
      d.getDate() === selected.getDate()
    );
  };

  const dayAppointments = appointments.filter((a) => {
    const aDate = new Date(a.startTime);
    return (
      aDate.getFullYear() === selected.getFullYear() &&
      aDate.getMonth() === selected.getMonth() &&
      aDate.getDate() === selected.getDate()
    );
  });

  const countByDay = weekDays.map((d) =>
    appointments.filter((a) => {
      const ad = new Date(a.startTime);
      return (
        ad.getFullYear() === d.getFullYear() &&
        ad.getMonth() === d.getMonth() &&
        ad.getDate() === d.getDate()
      );
    }).length,
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Agenda
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {selected.toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <CreateAppointmentDialog
          orgSlug={orgSlug}
          defaultDate={selectedDate}
          teamMembers={teamMembers}
          leads={leads}
          vehicles={vehicles}
          defaultLeadId={defaultLeadId}
          defaultVehicleId={defaultVehicleId}
          autoOpen={autoOpenAppointment}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigateWeek(-1)}
          className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex flex-1 gap-1">
          {weekDays.map((d, i) => (
            <button
              key={i}
              type="button"
              onClick={() => selectDay(d)}
              className={`flex-1 rounded-lg px-2 py-2 text-center transition-colors ${
                isSelected(d)
                  ? 'bg-purple-600 text-white'
                  : isToday(d)
                    ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <p className="text-xs font-medium">{WEEKDAYS[i]}</p>
              <p className="text-lg font-bold">{d.getDate()}</p>
              {countByDay[i]! > 0 && !isSelected(d) ? (
                <span className="mt-0.5 inline-block h-1.5 w-1.5 rounded-full bg-purple-500" />
              ) : null}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => navigateWeek(1)}
          className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {dayAppointments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-700">
          <p className="text-zinc-500 dark:text-zinc-400">
            Nenhum agendamento para este dia
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {dayAppointments.map((apt) => {
            const typeInfo = TYPE_LABELS[apt.type] ?? TYPE_LABELS.OTHER!;

            return (
              <div
                key={apt.id}
                className={`rounded-xl border-l-4 bg-white p-4 shadow-sm dark:bg-zinc-950 ${
                  STATUS_STYLES[apt.status] ?? 'border-l-zinc-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span>{typeInfo.emoji}</span>
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {apt.title}
                      </h3>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {typeInfo.label}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatTime(apt.startTime)} – {formatTime(apt.endTime)}
                      </span>

                      {apt.assignedTo ? (
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {apt.assignedTo.name?.split(' ')[0] ??
                            apt.assignedTo.email}
                        </span>
                      ) : null}

                      {apt.lead ? (
                        <Link
                          href={`/${orgSlug}/leads/${apt.lead.id}`}
                          className="flex items-center gap-1 text-purple-600 hover:underline dark:text-purple-400"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {apt.lead.name}
                        </Link>
                      ) : null}

                      {apt.vehicle ? (
                        <span className="flex items-center gap-1">
                          <Car className="h-3.5 w-3.5" />
                          {apt.vehicle.brand} {apt.vehicle.model}
                        </span>
                      ) : null}
                    </div>

                    {apt.notes ? (
                      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                        {apt.notes}
                      </p>
                    ) : null}
                  </div>

                  <AppointmentActions
                    orgSlug={orgSlug}
                    appointmentId={apt.id}
                    currentStatus={apt.status}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
