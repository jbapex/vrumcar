'use client';

import {
  deleteTaskAction,
  toggleTaskAction,
} from '@/app/[orgSlug]/tasks/actions';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  Trash2,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  completedAt: string | null;
  lead: { id: string; name: string } | null;
  vehicle: { id: string; brand: string; model: string } | null;
  assignedTo: { id: string; name: string | null; email: string } | null;
  createdBy: { id: string; name: string | null } | null;
}

interface Props {
  title: string;
  tasks: Task[];
  orgSlug: string;
  titleColor?: string;
  defaultCollapsed?: boolean;
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: 'border-l-red-500',
  HIGH: 'border-l-orange-400',
  MEDIUM: 'border-l-blue-400',
  LOW: 'border-l-zinc-300',
};

function formatDueDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);
  const taskDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (taskDate.getTime() === today.getTime()) return 'Hoje';
  if (taskDate.getTime() === tomorrow.getTime()) return 'Amanhã';
  if (taskDate < today) {
    const days = Math.floor(
      (today.getTime() - taskDate.getTime()) / 86400000,
    );
    return `${days}d atrás`;
  }
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function TaskList({
  title,
  tasks,
  orgSlug,
  titleColor,
  defaultCollapsed,
}: Props) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(defaultCollapsed ?? false);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (taskId: string) => {
    startTransition(async () => {
      await toggleTaskAction(orgSlug, taskId);
      router.refresh();
    });
  };

  const handleDelete = (taskId: string) => {
    if (!confirm('Excluir esta tarefa?')) return;
    startTransition(async () => {
      await deleteTaskAction(orgSlug, taskId);
      router.refresh();
    });
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="mb-2 flex items-center gap-2"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4 text-zinc-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-zinc-400" />
        )}
        <h2
          className={`text-sm font-semibold ${titleColor ?? 'text-zinc-700 dark:text-zinc-200'}`}
        >
          {title}
        </h2>
        <span className="rounded-full bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {tasks.length}
        </span>
      </button>

      {!collapsed ? (
        <div className="space-y-1">
          {tasks.map((task) => {
            const isCompleted = task.status === 'COMPLETED';
            const isOverdue =
              !isCompleted &&
              task.dueDate &&
              new Date(task.dueDate) < new Date();

            return (
              <div
                key={task.id}
                className={`group flex items-center gap-3 rounded-lg border-l-4 bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md dark:bg-zinc-950 ${
                  PRIORITY_COLORS[task.priority] ?? 'border-l-zinc-200'
                } ${isPending ? 'opacity-50' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => handleToggle(task.id)}
                  className={`flex-shrink-0 rounded-full p-0.5 ${
                    isCompleted
                      ? 'text-green-600 hover:text-green-700'
                      : 'text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium ${
                      isCompleted
                        ? 'text-zinc-400 line-through'
                        : 'text-zinc-900 dark:text-zinc-100'
                    }`}
                  >
                    {task.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-3">
                    {task.lead ? (
                      <Link
                        href={`/${orgSlug}/leads/${task.lead.id}`}
                        className="text-xs text-purple-600 hover:underline dark:text-purple-400"
                      >
                        {task.lead.name}
                      </Link>
                    ) : null}
                    {task.vehicle ? (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        🚗 {task.vehicle.brand} {task.vehicle.model}
                      </span>
                    ) : null}
                    {task.assignedTo ? (
                      <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                        <User className="h-3 w-3" />
                        {task.assignedTo.name?.split(' ')[0] ??
                          task.assignedTo.email}
                      </span>
                    ) : null}
                  </div>
                </div>

                {task.dueDate ? (
                  <span
                    className={`flex items-center gap-1 whitespace-nowrap text-xs ${
                      isOverdue
                        ? 'font-medium text-red-600'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {isOverdue ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : null}
                    <Clock className="h-3 w-3" />
                    {formatDueDate(task.dueDate)}
                  </span>
                ) : null}

                <button
                  type="button"
                  onClick={() => handleDelete(task.id)}
                  className="flex-shrink-0 rounded p-1 text-zinc-300 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
