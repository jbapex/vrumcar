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
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ShoppingCart } from 'lucide-react';
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Vendas</h1>
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
              type="search"
              placeholder="Cliente, veículo, contrato..."
              defaultValue={filters.search ?? ''}
            />
          </div>
          <div className="min-w-[160px] space-y-2">
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
          <div className="min-w-[200px] space-y-2">
            <label htmlFor="paymentMethod" className="text-sm font-medium">
              Forma de pagamento
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
              defaultValue={filters.paymentMethod ?? ''}
            >
              {PAYMENT_OPTIONS.map((o) => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[180px] space-y-2">
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
          <div className="min-w-[140px] space-y-2">
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
          <ShoppingCart className="size-12 opacity-50" aria-hidden />
          <p className="max-w-md text-center text-sm">
            Nenhuma venda registrada ainda. As vendas aparecem aqui quando você
            fecha uma venda a partir de um lead.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-left font-medium">Data</th>
                <th className="p-3 text-left font-medium">Cliente</th>
                <th className="p-3 text-left font-medium">Veículo</th>
                <th className="p-3 text-left font-medium">Vendedor</th>
                <th className="p-3 text-left font-medium">Valor final</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="p-3 whitespace-nowrap">
                    {formatDate(row.soldAt)}
                  </td>
                  <td className="p-3 font-medium">{row.customer.name}</td>
                  <td className="p-3">
                    {row.vehicle.brand} {row.vehicle.model}{' '}
                    {row.vehicle.year ?? ''}
                  </td>
                  <td className="p-3">
                    {row.salesPerson.name ?? '—'}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {formatPriceBRL(row.finalPriceCents)}
                  </td>
                  <td className="p-3">
                    <SaleStatusBadge status={row.status} />
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/${orgSlug}/sales/${row.id}`}
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
                href={`/${orgSlug}/sales?${prevQs.toString()}`}
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
                href={`/${orgSlug}/sales?${nextQs.toString()}`}
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
