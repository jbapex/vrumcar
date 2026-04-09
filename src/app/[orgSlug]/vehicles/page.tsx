import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatKm, formatPriceBRL } from '@/lib/format';
import { listVehicles } from '@/modules/vehicles/service';
import {
  filtersToSearchParams,
  parseVehicleFiltersFromSearchParams,
} from '@/modules/vehicles/search-params';
import { VehicleStatusBadge } from '@/components/vehicles/status-badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Car } from 'lucide-react';
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Estoque</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/${orgSlug}/vehicles/export?${exportQs.toString()}`}
            className={cn(buttonVariants())}
          >
            Exportar CSV
          </Link>
          <Link
            href={`/${orgSlug}/vehicles/new`}
            className={cn(buttonVariants())}
          >
            + Novo veículo
          </Link>
        </div>
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
              placeholder="Marca, modelo, placa…"
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
              <option value="">Todos</option>
              <option value="AVAILABLE">Disponível</option>
              <option value="RESERVED">Reservado</option>
              <option value="SOLD">Vendido</option>
              <option value="IN_PREPARATION">Em preparação</option>
              <option value="IN_MAINTENANCE">Em manutenção</option>
              <option value="INACTIVE">Inativo</option>
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
              <option value="createdAt">Data de cadastro</option>
              <option value="updatedAt">Última atualização</option>
              <option value="salePriceCents">Preço</option>
              <option value="brand">Marca</option>
              <option value="year">Ano</option>
              <option value="mileageKm">Quilometragem</option>
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
          <Button type="submit">Filtrar</Button>
        </div>
      </form>

      {result.items.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16">
          <Car className="size-12 opacity-50" aria-hidden />
          <p className="max-w-sm text-center text-sm">
            Nenhum veículo cadastrado. Clique em &quot;Novo veículo&quot; pra
            começar.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-left font-medium">Foto</th>
                <th className="p-3 text-left font-medium">Marca / Modelo</th>
                <th className="p-3 text-left font-medium">Ano</th>
                <th className="p-3 text-left font-medium">KM</th>
                <th className="p-3 text-left font-medium">Preço</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((row) => {
                const cover = row.photos[0];
                return (
                  <tr key={row.id} className="border-t">
                    <td className="p-3">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element -- URLs MinIO externas
                        <img
                          src={cover.url}
                          alt=""
                          width={60}
                          height={60}
                          className="size-[60px] rounded-md object-cover"
                        />
                      ) : (
                        <div className="bg-muted flex size-[60px] items-center justify-center rounded-md text-xs text-muted-foreground">
                          —
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{row.brand}</div>
                      <div className="text-muted-foreground">{row.model}</div>
                      {row.version ? (
                        <div className="text-muted-foreground text-xs">
                          {row.version}
                        </div>
                      ) : null}
                    </td>
                    <td className="p-3">{row.year ?? '—'}</td>
                    <td className="p-3">{formatKm(row.mileageKm)}</td>
                    <td className="p-3">{formatPriceBRL(row.salePriceCents)}</td>
                    <td className="p-3">
                      <VehicleStatusBadge status={row.status} />
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/${orgSlug}/vehicles/${row.id}`}
                        className="text-primary font-medium underline-offset-4 hover:underline"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                );
              })}
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
                href={`/${orgSlug}/vehicles?${prevQs.toString()}`}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
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
                href={`/${orgSlug}/vehicles?${nextQs.toString()}`}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
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
