import { DataListCard } from '@/components/layout/data-list-card';
import { PageHeader } from '@/components/layout/page-header';
import {
  ListPageEmpty,
  ListTable,
  ListTableBody,
  ListTableCell,
  ListTableHeadCell,
  ListTableHeader,
  ListTableRow,
  ListTableWrap,
  listPageSectionClass,
} from '@/components/layout/list-table';
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
import { listInterestedLeadsForVehicle } from '@/modules/leads/vehicle-interest';
import { VehicleInterestedLeadsPanel } from '@/components/vehicles/vehicle-interested-leads-panel';
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

  const interestedLeads = await listInterestedLeadsForVehicle(org.id, id);

  const photos = [...vehicle.photos].sort((a, b) => a.order - b.order);
  const vehicleTitle = [
    vehicle.brand,
    vehicle.model,
    vehicle.version,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={listPageSectionClass}>
      <PageHeader
        breadcrumbs={
          <>
            <span className="font-medium text-foreground">VrumCar</span>
            <span className="mx-1.5">/</span>
            <span>Estoque</span>
            <span className="mx-1.5">/</span>
            <span>{vehicle.model}</span>
          </>
        }
        title="Editar veículo"
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span>{vehicleTitle}</span>
            <VehicleStatusBadge status={vehicle.status} />
          </span>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <VehicleStatusSelect
            key={vehicle.status}
            orgSlug={orgSlug}
            vehicleId={vehicle.id}
            current={vehicle.status}
          />
          <VehicleDeleteButton orgSlug={orgSlug} vehicleId={vehicle.id} />
        </div>
      </PageHeader>

      <DataListCard>
        <VehicleEditTabs
          dados={
            <VehicleDataForm orgSlug={orgSlug} mode="edit" vehicle={vehicle} />
          }
          fotos={
            <PhotoUploader
              orgSlug={orgSlug}
              vehicleId={vehicle.id}
              existingPhotos={photos}
            />
          }
          custos={<VehicleCostsPanel orgSlug={orgSlug} vehicle={vehicle} />}
          interessados={
            <VehicleInterestedLeadsPanel
              orgSlug={orgSlug}
              vehicleLabel={vehicleTitle}
              leads={interestedLeads}
            />
          }
          historico={
            vehicle.priceHistory.length === 0 ? (
              <ListPageEmpty className="py-8">
                <p className="text-center text-xs">
                  Nenhuma alteração de preço registrada.
                </p>
              </ListPageEmpty>
            ) : (
              <ListTableWrap>
                <ListTable>
                  <ListTableHeader>
                    <ListTableHeadCell>Data</ListTableHeadCell>
                    <ListTableHeadCell className="text-right">
                      Preço antigo
                    </ListTableHeadCell>
                    <ListTableHeadCell className="text-right">
                      Preço novo
                    </ListTableHeadCell>
                    <ListTableHeadCell>Motivo</ListTableHeadCell>
                    <ListTableHeadCell>Usuário</ListTableHeadCell>
                  </ListTableHeader>
                  <ListTableBody>
                    {vehicle.priceHistory.map((h) => (
                      <ListTableRow key={h.id}>
                        <ListTableCell>{formatDate(h.changedAt)}</ListTableCell>
                        <ListTableCell className="text-right">
                          {formatPriceBRL(h.oldPriceCents)}
                        </ListTableCell>
                        <ListTableCell className="text-right">
                          {formatPriceBRL(h.newPriceCents)}
                        </ListTableCell>
                        <ListTableCell>{h.reason ?? '—'}</ListTableCell>
                        <ListTableCell className="font-mono text-[0.6875rem]">
                          {h.changedBy ?? '—'}
                        </ListTableCell>
                      </ListTableRow>
                    ))}
                  </ListTableBody>
                </ListTable>
              </ListTableWrap>
            )
          }
        />
      </DataListCard>
    </div>
  );
}
