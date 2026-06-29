import { CreateTaskDialog } from '@/components/tasks/create-task-dialog';
import { TaskList } from '@/components/tasks/task-list';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { listTasks } from '@/modules/tasks/task-service';
import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ leadId?: string; new?: string }>;
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export default async function TasksPage({ params, searchParams }: Props) {
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

  const tasks = await listTasks(org.id, {
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

  const serializedTasks = tasks.map((t) => ({
    ...t,
    dueDate: t.dueDate?.toISOString() ?? null,
    completedAt: t.completedAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  const teamMembers = members.map((m) => ({
    userId: m.user.id,
    name: m.user.name ?? m.user.email,
  }));

  const overdue = serializedTasks.filter(
    (t) =>
      t.status !== 'COMPLETED' &&
      t.status !== 'CANCELLED' &&
      t.dueDate &&
      new Date(t.dueDate) < new Date(),
  );
  const today = serializedTasks.filter(
    (t) =>
      t.status !== 'COMPLETED' &&
      t.status !== 'CANCELLED' &&
      t.dueDate &&
      isToday(new Date(t.dueDate)),
  );
  const upcoming = serializedTasks.filter(
    (t) =>
      t.status !== 'COMPLETED' &&
      t.status !== 'CANCELLED' &&
      t.dueDate &&
      new Date(t.dueDate) > new Date() &&
      !isToday(new Date(t.dueDate)),
  );
  const noDueDate = serializedTasks.filter(
    (t) =>
      t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && !t.dueDate,
  );
  const completed = serializedTasks.filter(
    (t) => t.status === 'COMPLETED' || t.status === 'CANCELLED',
  );

  const pendingCount = serializedTasks.filter(
    (t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED',
  ).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Tarefas
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {pendingCount} pendentes
          </p>
        </div>
        <CreateTaskDialog
          orgSlug={orgSlug}
          teamMembers={teamMembers}
          leads={leads}
          defaultLeadId={sp.leadId}
          autoOpen={sp.new === '1'}
        />
      </div>

      {overdue.length > 0 ? (
        <TaskList
          title="Atrasadas"
          tasks={overdue}
          orgSlug={orgSlug}
          titleColor="text-red-600"
        />
      ) : null}

      {today.length > 0 ? (
        <TaskList
          title="Hoje"
          tasks={today}
          orgSlug={orgSlug}
          titleColor="text-amber-600"
        />
      ) : null}

      {upcoming.length > 0 ? (
        <TaskList title="Próximas" tasks={upcoming} orgSlug={orgSlug} />
      ) : null}

      {noDueDate.length > 0 ? (
        <TaskList
          title="Sem prazo"
          tasks={noDueDate}
          orgSlug={orgSlug}
          titleColor="text-zinc-400"
        />
      ) : null}

      {completed.length > 0 ? (
        <TaskList
          title="Concluídas"
          tasks={completed}
          orgSlug={orgSlug}
          titleColor="text-green-600"
          defaultCollapsed
        />
      ) : null}
    </div>
  );
}
