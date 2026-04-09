import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatPhone } from '@/lib/format/phone';
import { LEAD_SOURCE_LABELS } from '@/lib/labels/leads';
import { listLeads } from '@/modules/leads/service';
import {
  leadFiltersToSearchParams,
  parseLeadFiltersFromSearchParams,
} from '@/modules/leads/search-params';
import { LeadPriorityBadge } from '@/components/leads/priority-badge';
import { LeadStatusBadge } from '@/components/leads/status-badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Users } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

const PRIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'HOT', label: 'Quente' },
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'NEW', label: 'Novo' },
  { value: 'CONTACTED', label: 'Contatado' },
  { value: 'QUALIFIED', label: 'Qualificado' },
  { value: 'VISITING', label: 'Em visita' },
  { value: 'NEGOTIATING', label: 'Negociando' },
  { value: 'WON', label: 'Ganhou' },
  { value: 'LOST', label: 'Perdeu' },
  { value: 'ARCHIVED', label: 'Arquivado' },
];

const SOURCE_OPTIONS = [
  { value: '', label: 'Todas' },
  ...Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

const ORDER_BY_OPTIONS = [
  { value: 'createdAt', label: 'Data de cadastro' },
  { value: 'updatedAt', label: 'Última atualização' },
  { value: 'name', label: 'Nome' },
  { value: 'lastContactAt', label: 'Último contato' },
  { value: 'priority', label: 'Prioridade' },
];

export default async function LeadsListPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { orgSlug } = await params;
  const sp = await searchParams;

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      memberships: {
        where: { userId: session.user.id, isActive: true },
        take: 1,
      },
    },
  });

  if (!org || org.memberships.length === 0) {
    notFound();
  }

  const membership = org.memberships[0]!;
  const filters = parseLeadFiltersFromSearchParams(sp);
  const result = await listLeads(org.id, filters, {
    userId: session.user.id,
    role: membership.role,
  });

  const prevPage = filters.page > 1 ? filters.page - 1 : null;
  const nextPage =
    filters.page < result.totalPages ? filters.page + 1 : null;

  const prevQs =
    prevPage != null
      ? leadFiltersToSearchParams({ ...filters, page: prevPage })
      : null;
  const nextQs =
    nextPage != null
      ? leadFiltersToSearchParams({ ...filters, page: nextPage })
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
        <Link href={`/${orgSlug}/leads/new`} className={cn(buttonVariants())}>
          + Novo lead
        </Link>
      </div>

      <form method="GET" className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="min-w-[200px] flex-1 space-y-2">
            <label htmlFor="search" className="text-sm font-medium">
              Buscar
            </label>
            <Input
              id="search"
              name="search"
              placeholder="Nome, telefone, email…"
              defaultValue={filters.search ?? ''}
            />
          </div>
          <div className="w-full min-w-[160px] space-y-2 sm:w-48">
            <label htmlFor="status" className="text-sm font-medium">
              Status
            </label>
            <select
              id="status"
              name="status"
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
              defaultValue={filters.status ?? ''}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full min-w-[160px] space-y-2 sm:w-48">
            <label htmlFor="source" className="text-sm font-medium">
              Origem
            </label>
            <select
              id="source"
              name="source"
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
              defaultValue={filters.source ?? ''}
            >
              {SOURCE_OPTIONS.map((o) => (
                <option key={o.value || 'all-src'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full min-w-[140px] space-y-2 sm:w-40">
            <label htmlFor="priority" className="text-sm font-medium">
              Prioridade
            </label>
            <select
              id="priority"
              name="priority"
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
              defaultValue={filters.priority ?? ''}
            >
              {PRIORITY_OPTIONS.map((o) => (
                <option key={o.value || 'all-pri'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full min-w-[180px] space-y-2 sm:w-56">
            <label htmlFor="orderBy" className="text-sm font-medium">
              Ordenar por
            </label>
            <select
              id="orderBy"
              name="orderBy"
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
              defaultValue={filters.orderBy}
            >
              {ORDER_BY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full min-w-[140px] space-y-2 sm:w-40">
            <label htmlFor="orderDir" className="text-sm font-medium">
              Direção
            </label>
            <select
              id="orderDir"
              name="orderDir"
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
              defaultValue={filters.orderDir}
            >
              <option value="desc">Decrescente</option>
              <option value="asc">Crescente</option>
            </select>
          </div>
          <input type="hidden" name="page" value="1" />
          <input
            type="hidden"
            name="pageSize"
            value={String(filters.pageSize)}
          />
          <Button type="submit">Filtrar</Button>
        </div>
      </form>

      {result.items.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16">
          <Users className="size-12 opacity-50" aria-hidden />
          <p className="max-w-sm text-center text-sm">
            Nenhum lead encontrado. Clique em &apos;+ Novo lead&apos; pra
            começar.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-left font-medium">Nome</th>
                <th className="p-3 text-left font-medium">Telefone</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Prioridade</th>
                <th className="p-3 text-left font-medium">Origem</th>
                <th className="p-3 text-left font-medium">Vendedor</th>
                <th className="p-3 text-left font-medium">
                  Veículo interesse
                </th>
                <th className="p-3 text-left font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="p-3 font-medium">{row.name}</td>
                  <td className="p-3">{formatPhone(row.phone)}</td>
                  <td className="p-3">
                    <LeadStatusBadge status={row.status} />
                  </td>
                  <td className="p-3">
                    <LeadPriorityBadge priority={row.priority} />
                  </td>
                  <td className="p-3">
                    {LEAD_SOURCE_LABELS[row.source]}
                  </td>
                  <td className="p-3">
                    {row.assignedTo?.name ?? '—'}
                  </td>
                  <td className="p-3">
                    {row.interestVehicle
                      ? `${row.interestVehicle.brand} ${row.interestVehicle.model} ${row.interestVehicle.year ?? ''}`
                      : '—'}
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/${orgSlug}/leads/${row.id}`}
                      className="text-primary font-medium underline-offset-4 hover:underline"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result.total > 0 ? (
        <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-3 text-sm">
          <span>
            Página {filters.page} de {result.totalPages}
          </span>
          <div className="flex gap-2">
            {prevQs ? (
              <Link
                href={`/${orgSlug}/leads?${prevQs.toString()}`}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                )}
              >
                Anterior
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Anterior
              </Button>
            )}
            {nextQs ? (
              <Link
                href={`/${orgSlug}/leads?${nextQs.toString()}`}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                )}
              >
                Próxima
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Próxima
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
