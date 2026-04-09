import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
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
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Novo veículo</h1>
      <VehicleDataForm orgSlug={orgSlug} mode="create" />
    </div>
  );
}
