import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate, formatPriceBRL } from '@/lib/format';
import { PAYMENT_METHOD_LABELS, SALE_STATUS_LABELS } from '@/lib/labels/sales';
import { listSales } from '@/modules/sales/service';
import {
  parseSaleFiltersFromSearchParams,
  saleFiltersToSearchParams,
} from '@/modules/sales/search-params';
import { SaleStatusBadge } from '@/components/sales/sale-status-badge';
import { DataListCard } from '@/components/layout/data-list-card';
import {
  ListPageEmpty,
  ListTable,
  ListTableBody,
  ListTableCell,
  ListTableHeadCell,
  ListTableHeader,
  ListTableRow,
  ListTableWrap,
  listPageNativeSelectClass,
} from '@/components/layout/list-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LUCIDE_STROKE_THIN } from '@/lib/ui/lucide';
import { cn } from '@/lib/utils';
import { Search, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos' },
  ...(
    Object.entries(SALE_STATUS_LABELS) as [keyof typeof SALE_STATUS_LABELS, string][]
  ).map(([value, label]) => ({ value, label })),
];

const PAYMENT_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todas' },
  ...(
    Object.entries(PAYMENT_METHOD_LABELS) as [
      keyof typeof PAYMENT_METHOD_LABELS,
      string,
    ][]
  ).map(([value, label]) => ({ value, label })),
];

const ORDER_BY_OPTIONS = [
  { value: 'soldAt', label: 'Data da venda' },
  { value: 'createdAt', label: 'Data de cadastro' },
  { value: 'finalPriceCents', label: 'Valor final' },
];

export default async function SalesListPage({
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

  const filters = parseSaleFiltersFromSearchParams(sp);
  const result = await listSales(org.id, filters);

  const prevPage = filters.page > 1 ? filters.page - 1 : null;
  const nextPage =
    filters.page < result.totalPages ? filters.page + 1 : null;

  const prevQs =
    prevPage != null
      ? saleFiltersToSearchParams({ ...filters, page: prevPage })
      : null;
  const nextQs =
    nextPage != null
      ? saleFiltersToSearchParams({ ...filters, page: nextPage })
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={
          <>
            <span className="font-medium text-foreground">VrumCar</span>
            <span className="mx-1.5">/</span>
            <span>Vendas</span>
          </>
        }
        title="Vendas"
        description="Histórico de vendas fechadas — busque por cliente, veículo ou contrato."
      />

      <DataListCard>
        <form method="GET" className="flex flex-col">
          <div className="flex flex-col gap-4 border-b border-border/50 bg-muted/15 px-4 py-5 md:px-6">
            {result.total > 0 ? (
              <p className="text-center text-sm text-muted-foreground md:text-left">
                {result.total} venda{result.total !== 1 ? 's' : ''} registrada
                {result.total !== 1 ? 's' : ''}
              </p>
            ) : null}
            <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
              <div className="relative min-w-[220px] flex-1">
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
                  type="search"
                  variant="pill"
                  className="pl-10"
                  placeholder="Cliente, veículo, contrato..."
                  defaultValue={filters.search ?? ''}
                />
              </div>
              <div className="min-w-[160px] space-y-1.5">
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
              <div className="min-w-[200px] space-y-1.5">
                <label
                  htmlFor="paymentMethod"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Forma de pagamento
                </label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  className={listPageNativeSelectClass}
                  defaultValue={filters.paymentMethod ?? ''}
                >
                  {PAYMENT_OPTIONS.map((o) => (
                    <option key={o.value || 'all'} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-[180px] space-y-1.5">
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
              <div className="min-w-[140px] space-y-1.5">
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
              <Button type="submit" size="pill" className="w-full sm:w-auto">
                Filtrar
              </Button>
            </div>
          </div>
        </form>

        {result.items.length === 0 ? (
          <div className="p-6">
            <ListPageEmpty>
              <ShoppingCart
                className="size-12 opacity-50"
                strokeWidth={LUCIDE_STROKE_THIN}
                aria-hidden
              />
              <p className="max-w-md text-center text-sm">
                Nenhuma venda registrada ainda. As vendas aparecem aqui quando
                você fecha uma venda a partir de um lead.
              </p>
            </ListPageEmpty>
          </div>
        ) : (
          <ListTableWrap>
            <ListTable>
              <ListTableHeader>
                <ListTableHeadCell>Data</ListTableHeadCell>
                <ListTableHeadCell>Cliente</ListTableHeadCell>
                <ListTableHeadCell>Veículo</ListTableHeadCell>
                <ListTableHeadCell>Vendedor</ListTableHeadCell>
                <ListTableHeadCell>Valor final</ListTableHeadCell>
                <ListTableHeadCell>Status</ListTableHeadCell>
                <ListTableHeadCell>Ações</ListTableHeadCell>
              </ListTableHeader>
              <ListTableBody>
                {result.items.map((row) => (
                  <ListTableRow key={row.id}>
                    <ListTableCell className="whitespace-nowrap">
                      {formatDate(row.soldAt)}
                    </ListTableCell>
                    <ListTableCell className="font-medium">
                      {row.customer.name}
                    </ListTableCell>
                    <ListTableCell>
                      {row.vehicle.brand} {row.vehicle.model}{' '}
                      {row.vehicle.year ?? ''}
                    </ListTableCell>
                    <ListTableCell>
                      {row.salesPerson.name ?? '—'}
                    </ListTableCell>
                    <ListTableCell className="whitespace-nowrap">
                      {formatPriceBRL(row.finalPriceCents)}
                    </ListTableCell>
                    <ListTableCell>
                      <SaleStatusBadge status={row.status} />
                    </ListTableCell>
                    <ListTableCell>
                      <Link
                        href={`/${orgSlug}/sales/${row.id}`}
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
      </DataListCard>

      {result.total > 0 ? (
        <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-3 text-sm">
          <span>
            Página {filters.page} de {result.totalPages}
          </span>
          <div className="flex gap-2">
            {prevQs ? (
              <Link
                href={`/${orgSlug}/sales?${prevQs.toString()}`}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  'rounded-full',
                )}
              >
                Anterior
              </Link>
            ) : (
              <Button variant="outline" size="sm" className="rounded-full" disabled>
                Anterior
              </Button>
            )}
            {nextQs ? (
              <Link
                href={`/${orgSlug}/sales?${nextQs.toString()}`}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  'rounded-full',
                )}
              >
                Próxima
              </Link>
            ) : (
              <Button variant="outline" size="sm" className="rounded-full" disabled>
                Próxima
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
