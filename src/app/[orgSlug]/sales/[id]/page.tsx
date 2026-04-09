import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate, formatKm, formatPriceBRL } from '@/lib/format';
import { formatPhone } from '@/lib/format/phone';
import { PAYMENT_METHOD_LABELS } from '@/lib/labels/sales';
import { getSaleById } from '@/modules/sales/service';
import { CancelSaleDialog } from '@/components/sales/cancel-sale-dialog';
import { SaleStatusBadge } from '@/components/sales/sale-status-badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

export default async function SaleDetailPage({
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

  const sale = await getSaleById(org.id, id);

  if (!sale) {
    notFound();
  }

  const idShort = sale.id.slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            Venda #{idShort}
          </h1>
          <SaleStatusBadge status={sale.status} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {sale.status === 'COMPLETED' ? (
            <CancelSaleDialog orgSlug={orgSlug} saleId={sale.id} />
          ) : null}
          <Link
            href={`/${orgSlug}/sales`}
            className={buttonVariants({ variant: 'outline' })}
          >
            Voltar à lista
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resumo da venda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Data: </span>
              {formatDate(sale.soldAt)}
            </p>
            <p className="text-lg font-semibold">
              Valor final: {formatPriceBRL(sale.finalPriceCents)}
            </p>
            <p>
              <span className="text-muted-foreground">Desconto: </span>
              {formatPriceBRL(sale.discountCents)}
            </p>
            <p>
              <span className="text-muted-foreground">Forma de pagamento: </span>
              {PAYMENT_METHOD_LABELS[sale.paymentMethod]}
            </p>
            {sale.paymentNotes ? (
              <p>
                <span className="text-muted-foreground">
                  Detalhes do pagamento:{' '}
                </span>
                {sale.paymentNotes}
              </p>
            ) : null}
            {sale.contractNumber ? (
              <p>
                <span className="text-muted-foreground">Contrato: </span>
                {sale.contractNumber}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Veículo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">
              {sale.vehicle.brand} {sale.vehicle.model}{' '}
              {sale.vehicle.year ?? ''}
            </p>
            {sale.vehicle.licensePlate ? (
              <p>
                <span className="text-muted-foreground">Placa: </span>
                {sale.vehicle.licensePlate}
              </p>
            ) : null}
            <Link
              href={`/${orgSlug}/vehicles/${sale.vehicle.id}`}
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              Ver veículo
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{sale.customer.name}</p>
            {sale.customer.phone ? (
              <p>{formatPhone(sale.customer.phone)}</p>
            ) : null}
            {sale.customer.email ? (
              <p className="text-muted-foreground">{sale.customer.email}</p>
            ) : null}
            <Link
              href={`/${orgSlug}/customers/${sale.customer.id}`}
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              Ver cliente
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vendedor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">
              {sale.salesPerson.name ?? sale.salesPerson.email}
            </p>
            <p className="text-muted-foreground">{sale.salesPerson.email}</p>
          </CardContent>
        </Card>

        {sale.lead ? (
          <Card>
            <CardHeader>
              <CardTitle>Lead de origem</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/${orgSlug}/leads/${sale.lead.id}`}
                className="text-primary font-medium underline-offset-4 hover:underline"
              >
                {sale.lead.name}
              </Link>
            </CardContent>
          </Card>
        ) : null}

        {sale.hasTradeIn ? (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Trade-in</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
              <p>
                <span className="text-muted-foreground">Veículo: </span>
                {sale.tradeInBrand ?? '—'} {sale.tradeInModel ?? ''}{' '}
                {sale.tradeInYear ?? ''}
              </p>
              <p>
                <span className="text-muted-foreground">KM: </span>
                {sale.tradeInMileageKm != null
                  ? formatKm(sale.tradeInMileageKm)
                  : '—'}
              </p>
              {sale.tradeInPlate ? (
                <p>
                  <span className="text-muted-foreground">Placa: </span>
                  {sale.tradeInPlate}
                </p>
              ) : null}
              <p>
                <span className="text-muted-foreground">Valor avaliado: </span>
                {formatPriceBRL(sale.tradeInValueCents)}
              </p>
              {sale.tradeInNotes ? (
                <p className="sm:col-span-2">
                  <span className="text-muted-foreground">Observações: </span>
                  {sale.tradeInNotes}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {sale.notes ? (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent className="whitespace-pre-wrap text-sm">
              {sale.notes}
            </CardContent>
          </Card>
        ) : null}

        {sale.status === 'CANCELLED' ? (
          <Card className="border-destructive/50 bg-destructive/5 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-destructive">
                Venda cancelada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {sale.cancelledAt ? (
                <p>
                  <span className="text-muted-foreground">Data: </span>
                  {formatDate(sale.cancelledAt)}
                </p>
              ) : null}
              {sale.cancelledReason ? (
                <p>
                  <span className="text-muted-foreground">Motivo: </span>
                  {sale.cancelledReason}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
