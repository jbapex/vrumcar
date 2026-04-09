import { VehicleDataForm } from '@/components/vehicles/vehicle-data-form';
import { VehicleDeleteButton } from '@/components/vehicles/vehicle-delete-button';
import { VehicleEditTabs } from '@/components/vehicles/vehicle-edit-tabs';
import { PhotoUploader } from '@/components/vehicles/photo-uploader';
import { VehicleCostsPanel } from '@/components/vehicles/vehicle-costs-panel';
import { VehicleStatusBadge } from '@/components/vehicles/status-badge';
import { VehicleStatusSelect } from '@/components/vehicles/vehicle-status-select';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate, formatPriceBRL } from '@/lib/format';
import { getVehicleById } from '@/modules/vehicles/service';
import { notFound, redirect } from 'next/navigation';

export default async function EditVehiclePage({
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

  const vehicle = await getVehicleById(org.id, id);
  if (!vehicle) {
    notFound();
  }

  const photos = [...vehicle.photos].sort((a, b) => a.order - b.order);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar veículo</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            {vehicle.brand} {vehicle.model}
            {vehicle.version ? ` ${vehicle.version}` : ''}
          </p>
          <div className="mt-2">
            <VehicleStatusBadge status={vehicle.status} />
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <VehicleStatusSelect
            key={vehicle.status}
            orgSlug={orgSlug}
            vehicleId={vehicle.id}
            current={vehicle.status}
          />
          <VehicleDeleteButton orgSlug={orgSlug} vehicleId={vehicle.id} />
        </div>
      </div>

      <VehicleEditTabs
        dados={<VehicleDataForm orgSlug={orgSlug} mode="edit" vehicle={vehicle} />}
        fotos={
          <PhotoUploader
            orgSlug={orgSlug}
            vehicleId={vehicle.id}
            existingPhotos={photos}
          />
        }
        custos={<VehicleCostsPanel orgSlug={orgSlug} vehicle={vehicle} />}
        historico={
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-2 text-left">Data</th>
                  <th className="p-2 text-right">Preço antigo</th>
                  <th className="p-2 text-right">Preço novo</th>
                  <th className="p-2 text-left">Motivo</th>
                  <th className="p-2 text-left">Usuário</th>
                </tr>
              </thead>
              <tbody>
                {vehicle.priceHistory.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-muted-foreground p-4 text-center"
                    >
                      Nenhuma alteração de preço registrada.
                    </td>
                  </tr>
                ) : (
                  vehicle.priceHistory.map((h) => (
                    <tr key={h.id} className="border-t">
                      <td className="p-2">{formatDate(h.changedAt)}</td>
                      <td className="p-2 text-right">
                        {formatPriceBRL(h.oldPriceCents)}
                      </td>
                      <td className="p-2 text-right">
                        {formatPriceBRL(h.newPriceCents)}
                      </td>
                      <td className="p-2">{h.reason ?? '—'}</td>
                      <td className="p-2 font-mono text-xs">
                        {h.changedBy ?? '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        }
      />
    </div>
  );
}
