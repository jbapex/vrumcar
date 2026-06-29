import { CalendarView } from '@/components/calendar/calendar-view';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { listAppointments } from '@/modules/appointments/appointment-service';
import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ date?: string; leadId?: string; vehicleId?: string; new?: string }>;
}

export default async function CalendarPage({ params, searchParams }: Props) {
  const { orgSlug } = await params;
  const sp = await searchParams;

  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      memberships: {
        where: { userId: session.user.id, isActive: true },
        take: 1,
      },
    },
  });
  if (!org || org.memberships.length === 0) redirect('/login');

  const role = org.memberships[0]!.role;
  const selectedDate = sp.date ? new Date(sp.date) : new Date();

  const weekStart = new Date(selectedDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const appointments = await listAppointments(org.id, {
    startDate: weekStart,
    endDate: weekEnd,
    userId: session.user.id,
    userRole: role,
  });

  const members = await prisma.membership.findMany({
    where: { organizationId: org.id, isActive: true },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  const leads = await prisma.lead.findMany({
    where: { organizationId: org.id, deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
    take: 100,
  });

  const vehicles = await prisma.vehicle.findMany({
    where: {
      organizationId: org.id,
      status: { in: ['AVAILABLE', 'RESERVED'] },
      deletedAt: null,
    },
    select: { id: true, brand: true, model: true, year: true },
    orderBy: { brand: 'asc' },
    take: 100,
  });

  const serialized = appointments.map((a) => ({
    ...a,
    startTime: a.startTime.toISOString(),
    endTime: a.endTime.toISOString(),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    cancelledAt: a.cancelledAt?.toISOString() ?? null,
  }));

  return (
    <CalendarView
      orgSlug={orgSlug}
      appointments={serialized}
      selectedDate={selectedDate.toISOString().split('T')[0]!}
      weekStart={weekStart.toISOString().split('T')[0]!}
      teamMembers={members.map((m) => ({
        userId: m.user.id,
        name: m.user.name ?? m.user.email,
      }))}
      leads={leads}
      vehicles={vehicles.map((v) => ({
        id: v.id,
        label: `${v.brand} ${v.model} ${v.year ?? ''}`.trim(),
      }))}
      defaultLeadId={sp.leadId}
      defaultVehicleId={sp.vehicleId}
      autoOpenAppointment={sp.new === '1'}
    />
  );
}
