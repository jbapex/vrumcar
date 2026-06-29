import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatKm, formatPriceBRL } from '@/lib/format';
import { listVehicles } from '@/modules/vehicles/service';
import { countInterestedLeadsByVehicleIds } from '@/modules/leads/vehicle-interest';
import {
  filtersToSearchParams,
  parseVehicleFiltersFromSearchParams,
} from '@/modules/vehicles/search-params';
import { VehicleStatusBadge } from '@/components/vehicles/status-badge';
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
import { listPageLinkClass } from '@/components/layout/module-form';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LUCIDE_STROKE_THIN } from '@/lib/ui/lucide';
import { cn } from '@/lib/utils';
import { Car, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';

export default async function VehiclesListPage({
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

  const filters = parseVehicleFiltersFromSearchParams(sp);
  const result = await listVehicles(org.id, filters);
  const interestCounts = await countInterestedLeadsByVehicleIds(
    org.id,
    result.items.map((v) => v.id),
  );

  const prevPage = filters.page > 1 ? filters.page - 1 : null;
  const nextPage =
    filters.page < result.totalPages ? filters.page + 1 : null;

  const exportQs = filtersToSearchParams({
    ...filters,
    page: 1,
    pageSize: 10_000,
  });
  const prevQs =
    prevPage != null
      ? filtersToSearchParams({ ...filters, page: prevPage })
      : null;
  const nextQs =
    nextPage != null
      ? filtersToSearchParams({ ...filters, page: nextPage })
      : null;

  return (
    <div className={listPageSectionClass}>
      <PageHeader
        breadcrumbs={
          <>
            <span className="font-medium text-foreground">VrumCar</span>
            <span className="mx-1.5">/</span>
            <span>Estoque</span>
          </>
        }
        title="Estoque"
        description="Catálogo de veículos da sua loja — busque, filtre e acompanhe status."
      >
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/${orgSlug}/vehicles/export?${exportQs.toString()}`}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'rounded-full',
            )}
          >
            Exportar CSV
          </Link>
          <Link
            href={`/${orgSlug}/vehicles/new`}
            className={cn(
              buttonVariants({ size: 'sm' }),
              'gap-1.5 rounded-full',
            )}
          >
            <Plus className="size-3.5" strokeWidth={LUCIDE_STROKE_THIN} />
            Novo veículo
          </Link>
        </div>
      </PageHeader>

      <DataListCard>
        <form method="GET" className="flex flex-col">
          <div className={listPageToolbarClass}>
            <div className={listPageToolbarFieldsClass}>
              {result.total > 0 ? (
                <p className="hidden shrink-0 self-center text-xs text-muted-foreground md:block md:pb-0.5">
                  {result.total} veículo{result.total !== 1 ? 's' : ''}
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
                  placeholder="Marca, modelo, placa…"
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
                  <option value="">Todos</option>
                  <option value="AVAILABLE">Disponível</option>
                  <option value="RESERVED">Reservado</option>
                  <option value="SOLD">Vendido</option>
                  <option value="IN_PREPARATION">Em preparação</option>
                  <option value="IN_MAINTENANCE">Em manutenção</option>
                  <option value="INACTIVE">Inativo</option>
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
                  <option value="createdAt">Data de cadastro</option>
                  <option value="updatedAt">Última atualização</option>
                  <option value="salePriceCents">Preço</option>
                  <option value="brand">Marca</option>
                  <option value="year">Ano</option>
                  <option value="mileageKm">Quilometragem</option>
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
              <Car
                className="size-12 opacity-50"
                strokeWidth={LUCIDE_STROKE_THIN}
                aria-hidden
              />
              <p className="max-w-sm text-center text-xs">
                Nenhum veículo cadastrado. Use &quot;Novo veículo&quot; pra
                começar.
              </p>
            </ListPageEmpty>
          </div>
        ) : (
          <ListTableWrap>
            <ListTable>
              <ListTableHeader>
                <ListTableHeadCell>Foto</ListTableHeadCell>
                <ListTableHeadCell>Marca / modelo</ListTableHeadCell>
                <ListTableHeadCell>Ano</ListTableHeadCell>
                <ListTableHeadCell>KM</ListTableHeadCell>
                <ListTableHeadCell>Preço</ListTableHeadCell>
                <ListTableHeadCell>Interessados</ListTableHeadCell>
                <ListTableHeadCell>Status</ListTableHeadCell>
                <ListTableHeadCell>Ações</ListTableHeadCell>
              </ListTableHeader>
              <ListTableBody>
                {result.items.map((row) => {
                  const cover = row.photos[0];
                  return (
                    <ListTableRow key={row.id}>
                      <ListTableCell>
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element -- URLs MinIO externas
                          <img
                            src={cover.url}
                            alt=""
                            width={48}
                            height={48}
                            className="size-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="bg-muted flex size-12 items-center justify-center rounded-lg text-[0.6875rem] text-muted-foreground">
                            —
                          </div>
                        )}
                      </ListTableCell>
                      <ListTableCell>
                        <div className="font-medium">{row.brand}</div>
                        <div className="text-muted-foreground">{row.model}</div>
                        {row.version ? (
                          <div className="text-muted-foreground text-[0.6875rem]">
                            {row.version}
                          </div>
                        ) : null}
                      </ListTableCell>
                      <ListTableCell>{row.year ?? '—'}</ListTableCell>
                      <ListTableCell>{formatKm(row.mileageKm)}</ListTableCell>
                      <ListTableCell>
                        {formatPriceBRL(row.salePriceCents)}
                      </ListTableCell>
                      <ListTableCell>
                        {(interestCounts[row.id] ?? 0) > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                            {interestCounts[row.id]} lead
                            {(interestCounts[row.id] ?? 0) === 1 ? '' : 's'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </ListTableCell>
                      <ListTableCell>
                        <VehicleStatusBadge status={row.status} />
                      </ListTableCell>
                      <ListTableCell>
                        <Link
                          href={`/${orgSlug}/vehicles/${row.id}`}
                          className={listPageLinkClass}
                        >
                          Ver
                        </Link>
                      </ListTableCell>
                    </ListTableRow>
                  );
                })}
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
                href={`/${orgSlug}/vehicles?${prevQs.toString()}`}
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
                href={`/${orgSlug}/vehicles?${nextQs.toString()}`}
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
