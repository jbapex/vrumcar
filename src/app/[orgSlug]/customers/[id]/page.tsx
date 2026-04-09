import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate, formatPriceBRL } from '@/lib/format';
import { formatPhone } from '@/lib/format/phone';
import { getCustomerById } from '@/modules/customers/service';
import { CustomerForm } from '@/components/customers/customer-form';
import { DeleteCustomerButton } from '@/components/customers/delete-customer-button';
import { LeadStatusBadge } from '@/components/leads/status-badge';
import { SaleStatusBadge } from '@/components/sales/sale-status-badge';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { orgSlug, id } = await params;

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

  const customer = await getCustomerById(org.id, id);

  if (!customer) {
    notFound();
  }

  const customerSales = await prisma.sale.findMany({
    where: { organizationId: org.id, customerId: customer.id },
    include: {
      vehicle: {
        select: { id: true, brand: true, model: true, year: true },
      },
    },
    orderBy: { soldAt: 'desc' },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
          <p className="text-muted-foreground text-sm">Editar cadastro</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DeleteCustomerButton orgSlug={orgSlug} customerId={customer.id} />
          <Link
            href={`/${orgSlug}/customers`}
            className={buttonVariants({ variant: 'outline' })}
          >
            Voltar à lista
          </Link>
        </div>
      </div>

      <CustomerForm orgSlug={orgSlug} mode="edit" initial={customer} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Histórico de leads</h2>
        {customer.leads.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhum lead vinculado a este cliente.
          </p>
        ) : (
          <ul className="space-y-2 rounded-md border p-4">
            {[...customer.leads]
              .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
              .map((lead) => (
              <li
                key={lead.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 last:border-0 last:pb-0"
              >
                <div>
                  <Link
                    href={`/${orgSlug}/leads/${lead.id}`}
                    className="text-primary font-medium underline-offset-4 hover:underline"
                  >
                    {lead.name}
                  </Link>
                  <span className="text-muted-foreground ml-2 text-sm">
                    {formatPhone(lead.phone)} ·{' '}
                    {lead.createdAt.toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <LeadStatusBadge status={lead.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Vendas</h2>
        {customerSales.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Este cliente ainda não fez nenhuma compra.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-3 text-left font-medium">Data</th>
                  <th className="p-3 text-left font-medium">Veículo</th>
                  <th className="p-3 text-left font-medium">Valor</th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 text-left font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {customerSales.map((sale) => (
                  <tr key={sale.id} className="border-t">
                    <td className="p-3 whitespace-nowrap">
                      {formatDate(sale.soldAt)}
                    </td>
                    <td className="p-3">
                      {sale.vehicle.brand} {sale.vehicle.model}{' '}
                      {sale.vehicle.year ?? ''}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {formatPriceBRL(sale.finalPriceCents)}
                    </td>
                    <td className="p-3">
                      <SaleStatusBadge status={sale.status} />
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/${orgSlug}/sales/${sale.id}`}
                        className="text-primary font-medium underline-offset-4 hover:underline"
                      >
                        Ver venda
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
