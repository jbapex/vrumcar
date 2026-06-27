import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatCpfCnpj, formatPhone } from '@/lib/format/phone';
import { listCustomers } from '@/modules/customers/service';
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
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

function first(
  v: string | string[] | undefined,
): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function parseCustomerListParams(
  sp: Record<string, string | string[] | undefined>,
) {
  const page = Math.max(1, parseInt(first(sp.page) ?? '1', 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(first(sp.pageSize) ?? '20', 10) || 20),
  );
  const search = first(sp.search)?.trim() || undefined;
  return { search, page, pageSize };
}

function toSearchParams(p: {
  search?: string;
  page: number;
  pageSize: number;
}): URLSearchParams {
  const q = new URLSearchParams();
  if (p.search) q.set('search', p.search);
  q.set('page', String(p.page));
  q.set('pageSize', String(p.pageSize));
  return q;
}

export default async function CustomersListPage({
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

  const listParams = parseCustomerListParams(sp);
  const result = await listCustomers(org.id, listParams);

  const prevPage = listParams.page > 1 ? listParams.page - 1 : null;
  const nextPage =
    listParams.page < result.totalPages ? listParams.page + 1 : null;

  const prevQs =
    prevPage != null
      ? toSearchParams({ ...listParams, page: prevPage })
      : null;
  const nextQs =
    nextPage != null
      ? toSearchParams({ ...listParams, page: nextPage })
      : null;

  return (
    <div className={listPageSectionClass}>
      <PageHeader
        breadcrumbs={
          <>
            <span className="font-medium text-foreground">VrumCar</span>
            <span className="mx-1.5">/</span>
            <span>Clientes</span>
          </>
        }
        title="Clientes"
        description="Base de clientes da loja — busque por nome, documento ou contato."
      >
        <Link
          href={`/${orgSlug}/customers/new`}
          className={cn(buttonVariants({ size: 'pill' }), 'gap-2')}
        >
          <Plus className="size-4" strokeWidth={LUCIDE_STROKE_THIN} />
          Novo cliente
        </Link>
      </PageHeader>

      <DataListCard>
        <form method="GET" className={listPageToolbarClass}>
          <div className={listPageToolbarFieldsClass}>
            {result.total > 0 ? (
              <p className="hidden shrink-0 self-center text-xs text-muted-foreground md:block md:pb-0.5">
                {result.total} cliente{result.total !== 1 ? 's' : ''}
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
              placeholder="Nome, CPF, telefone, email…"
              defaultValue={listParams.search ?? ''}
            />
          </div>
          <input type="hidden" name="page" value="1" />
          <input
            type="hidden"
            name="pageSize"
            value={String(listParams.pageSize)}
          />
          <Button
            type="submit"
            size="pill"
            className="w-full shrink-0 md:w-auto"
          >
            Filtrar
          </Button>
          </div>
        </form>

        {result.items.length === 0 ? (
          <div className="p-4">
            <ListPageEmpty>
              <p className="max-w-sm text-center text-sm">
                Nenhum cliente cadastrado.
              </p>
            </ListPageEmpty>
          </div>
        ) : (
          <ListTableWrap>
            <ListTable>
              <ListTableHeader>
                <ListTableHeadCell>Nome</ListTableHeadCell>
                <ListTableHeadCell>CPF/CNPJ</ListTableHeadCell>
                <ListTableHeadCell>Telefone</ListTableHeadCell>
                <ListTableHeadCell>Email</ListTableHeadCell>
                <ListTableHeadCell>Cidade/UF</ListTableHeadCell>
                <ListTableHeadCell>Ações</ListTableHeadCell>
              </ListTableHeader>
              <ListTableBody>
                {result.items.map((row) => {
                  const cityUf = [row.addressCity, row.addressState]
                    .filter(Boolean)
                    .join(' / ');
                  return (
                    <ListTableRow key={row.id}>
                      <ListTableCell className="font-medium">
                        {row.name}
                      </ListTableCell>
                      <ListTableCell>{formatCpfCnpj(row.cpfCnpj)}</ListTableCell>
                      <ListTableCell>{formatPhone(row.phone)}</ListTableCell>
                      <ListTableCell>{row.email ?? '—'}</ListTableCell>
                      <ListTableCell>{cityUf || '—'}</ListTableCell>
                      <ListTableCell>
                        <Link
                          href={`/${orgSlug}/customers/${row.id}`}
                          className="text-primary font-medium underline-offset-4 hover:underline"
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
              Página {listParams.page} de {result.totalPages}
            </span>
            <div className="flex gap-2">
              {prevQs ? (
                <Link
                  href={`/${orgSlug}/customers?${prevQs.toString()}`}
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
                  href={`/${orgSlug}/customers?${nextQs.toString()}`}
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
