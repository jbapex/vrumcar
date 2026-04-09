import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatCpfCnpj, formatPhone } from '@/lib/format/phone';
import { listCustomers } from '@/modules/customers/service';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
        <Link
          href={`/${orgSlug}/customers/new`}
          className={cn(buttonVariants())}
        >
          + Novo cliente
        </Link>
      </div>

      <form method="GET" className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="min-w-[200px] flex-1 space-y-2">
          <label htmlFor="search" className="text-sm font-medium">
            Buscar
          </label>
          <Input
            id="search"
            name="search"
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
        <Button type="submit">Filtrar</Button>
      </form>

      {result.items.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16">
          <p className="max-w-sm text-center text-sm">
            Nenhum cliente cadastrado.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-left font-medium">Nome</th>
                <th className="p-3 text-left font-medium">CPF/CNPJ</th>
                <th className="p-3 text-left font-medium">Telefone</th>
                <th className="p-3 text-left font-medium">Email</th>
                <th className="p-3 text-left font-medium">Cidade/UF</th>
                <th className="p-3 text-left font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((row) => {
                const cityUf = [row.addressCity, row.addressState]
                  .filter(Boolean)
                  .join(' / ');
                return (
                  <tr key={row.id} className="border-t">
                    <td className="p-3 font-medium">{row.name}</td>
                    <td className="p-3">{formatCpfCnpj(row.cpfCnpj)}</td>
                    <td className="p-3">{formatPhone(row.phone)}</td>
                    <td className="p-3">{row.email ?? '—'}</td>
                    <td className="p-3">{cityUf || '—'}</td>
                    <td className="p-3">
                      <Link
                        href={`/${orgSlug}/customers/${row.id}`}
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
            Página {listParams.page} de {result.totalPages}
          </span>
          <div className="flex gap-2">
            {prevQs ? (
              <Link
                href={`/${orgSlug}/customers?${prevQs.toString()}`}
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
                href={`/${orgSlug}/customers?${nextQs.toString()}`}
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
