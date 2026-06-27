import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { DataListCard } from '@/components/layout/data-list-card';
import { PageHeader } from '@/components/layout/page-header';
import { listPageSectionClass } from '@/components/layout/list-table';
import { VehicleDataForm } from '@/components/vehicles/vehicle-data-form';
import { notFound, redirect } from 'next/navigation';

export default async function NewVehiclePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { orgSlug } = await params;
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

  return (
    <div className={listPageSectionClass}>
      <PageHeader
        breadcrumbs={
          <>
            <span className="font-medium text-foreground">VrumCar</span>
            <span className="mx-1.5">/</span>
            <span>Estoque</span>
            <span className="mx-1.5">/</span>
            <span>Novo</span>
          </>
        }
        title="Novo veículo"
        description="Cadastre um veículo no estoque da loja."
      />

      <DataListCard className="p-4 md:p-5">
        <VehicleDataForm orgSlug={orgSlug} mode="create" />
      </DataListCard>
    </div>
  );
}
