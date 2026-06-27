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
import { DataListCard } from '@/components/layout/data-list-card';
import {
  ListPageCardFooter,
  ListPageEmpty,
  ListTable,
  ListTableBody,
  ListTableCell,
  ListTableHeadCell,
  ListTableHeader,
  ListTableRow,
  ListTableWrap,
  listPageFilterFieldClass,
  listPageNativeSelectClass,
  listPageSearchFieldClass,
  listPageSectionClass,
  listPageToolbarClass,
  listPageToolbarFieldsClass,
} from '@/components/layout/list-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LUCIDE_STROKE_THIN } from '@/lib/ui/lucide';
import { cn } from '@/lib/utils';
import { Plus, Search, Users } from 'lucide-react';
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
    <div className={listPageSectionClass}>
      <PageHeader
        breadcrumbs={
          <>
            <span className="font-medium text-foreground">VrumCar</span>
            <span className="mx-1.5">/</span>
            <span>Leads</span>
          </>
        }
        title="Leads"
        description="Oportunidades e contatos — priorize, filtre e acompanhe o funil."
      >
        <Link
          href={`/${orgSlug}/leads/new`}
          className={cn(buttonVariants({ size: 'pill' }), 'gap-2')}
        >
          <Plus className="size-4" strokeWidth={LUCIDE_STROKE_THIN} />
          Novo lead
        </Link>
      </PageHeader>

      <DataListCard>
        <form method="GET" className="flex flex-col">
          <div className={listPageToolbarClass}>
            <div className={listPageToolbarFieldsClass}>
              {result.total > 0 ? (
                <p className="hidden shrink-0 self-center text-xs text-muted-foreground md:block md:pb-0.5">
                  {result.total} lead{result.total !== 1 ? 's' : ''}
                </p>
              ) : null}
              <div className={listPageSearchFieldClass}>
                <label htmlFor="search" className="sr-only">
                  Buscar
                </label>
                <Search
                  className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                  strokeWidth={LUCIDE_STROKE_THIN}
                  aria-hidden
                />
                <Input
                  id="search"
                  name="search"
                  variant="pill"
                  className="pl-10"
                  placeholder="Nome, telefone, email…"
                  defaultValue={filters.search ?? ''}
                />
              </div>
              <div className={cn(listPageFilterFieldClass, 'md:w-[7.5rem]')}>
                <label
                  htmlFor="status"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  className={listPageNativeSelectClass}
                  defaultValue={filters.status ?? ''}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value || 'all'} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={cn(listPageFilterFieldClass, 'md:w-[7.5rem]')}>
                <label
                  htmlFor="source"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Origem
                </label>
                <select
                  id="source"
                  name="source"
                  className={listPageNativeSelectClass}
                  defaultValue={filters.source ?? ''}
                >
                  {SOURCE_OPTIONS.map((o) => (
                    <option key={o.value || 'all-src'} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={cn(listPageFilterFieldClass, 'md:w-[6.5rem]')}>
                <label
                  htmlFor="priority"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Prioridade
                </label>
                <select
                  id="priority"
                  name="priority"
                  className={listPageNativeSelectClass}
                  defaultValue={filters.priority ?? ''}
                >
                  {PRIORITY_OPTIONS.map((o) => (
                    <option key={o.value || 'all-pri'} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={cn(listPageFilterFieldClass, 'md:w-[8rem]')}>
                <label
                  htmlFor="orderBy"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Ordenar por
                </label>
                <select
                  id="orderBy"
                  name="orderBy"
                  className={listPageNativeSelectClass}
                  defaultValue={filters.orderBy}
                >
                  {ORDER_BY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={cn(listPageFilterFieldClass, 'md:w-[6.5rem]')}>
                <label
                  htmlFor="orderDir"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Direção
                </label>
                <select
                  id="orderDir"
                  name="orderDir"
                  className={listPageNativeSelectClass}
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
              <Button
                type="submit"
                size="pill"
                className="w-full shrink-0 md:w-auto"
              >
                Filtrar
              </Button>
            </div>
          </div>
        </form>

        {result.items.length === 0 ? (
          <div className="p-4">
            <ListPageEmpty>
              <Users
                className="size-12 opacity-50"
                strokeWidth={LUCIDE_STROKE_THIN}
                aria-hidden
              />
              <p className="max-w-sm text-center text-sm">
                Nenhum lead encontrado. Use &quot;Novo lead&quot; pra começar.
              </p>
            </ListPageEmpty>
          </div>
        ) : (
          <ListTableWrap>
            <ListTable>
              <ListTableHeader>
                <ListTableHeadCell>Nome</ListTableHeadCell>
                <ListTableHeadCell>Telefone</ListTableHeadCell>
                <ListTableHeadCell>Status</ListTableHeadCell>
                <ListTableHeadCell>Prioridade</ListTableHeadCell>
                <ListTableHeadCell>Origem</ListTableHeadCell>
                <ListTableHeadCell>Vendedor</ListTableHeadCell>
                <ListTableHeadCell>Veículo interesse</ListTableHeadCell>
                <ListTableHeadCell>Ações</ListTableHeadCell>
              </ListTableHeader>
              <ListTableBody>
                {result.items.map((row) => (
                  <ListTableRow key={row.id}>
                    <ListTableCell className="font-medium">{row.name}</ListTableCell>
                    <ListTableCell>{formatPhone(row.phone)}</ListTableCell>
                    <ListTableCell>
                      <LeadStatusBadge status={row.status} />
                    </ListTableCell>
                    <ListTableCell>
                      <LeadPriorityBadge priority={row.priority} />
                    </ListTableCell>
                    <ListTableCell>
                      {LEAD_SOURCE_LABELS[row.source]}
                    </ListTableCell>
                    <ListTableCell>
                      {row.assignedTo?.name ?? '—'}
                    </ListTableCell>
                    <ListTableCell>
                      {row.interestVehicle
                        ? `${row.interestVehicle.brand} ${row.interestVehicle.model} ${row.interestVehicle.year ?? ''}`
                        : '—'}
                    </ListTableCell>
                    <ListTableCell>
                      <Link
                        href={`/${orgSlug}/leads/${row.id}`}
                        className="text-primary font-medium underline-offset-4 hover:underline"
                      >
                        Ver
                      </Link>
                    </ListTableCell>
                  </ListTableRow>
                ))}
              </ListTableBody>
            </ListTable>
          </ListTableWrap>
        )}

        {result.total > 0 ? (
          <ListPageCardFooter>
            <span>
              Página {filters.page} de {result.totalPages}
            </span>
            <div className="flex gap-2">
              {prevQs ? (
                <Link
                  href={`/${orgSlug}/leads?${prevQs.toString()}`}
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                    'h-8 rounded-full px-3 text-xs',
                  )}
                >
                  Anterior
                </Link>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full px-3 text-xs"
                  disabled
                >
                  Anterior
                </Button>
              )}
              {nextQs ? (
                <Link
                  href={`/${orgSlug}/leads?${nextQs.toString()}`}
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                    'h-8 rounded-full px-3 text-xs',
                  )}
                >
                  Próxima
                </Link>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full px-3 text-xs"
                  disabled
                >
                  Próxima
                </Button>
              )}
            </div>
          </ListPageCardFooter>
        ) : null}
      </DataListCard>
    </div>
  );
}
