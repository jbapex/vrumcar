import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { CreateLeadForm } from '@/components/leads/create-lead-form';
import { notFound, redirect } from 'next/navigation';

export default async function NewLeadPage({
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

  const [users, vehicles] = await Promise.all([
    prisma.user.findMany({
      where: {
        memberships: {
          some: { organizationId: org.id, isActive: true },
        },
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    }),
    prisma.vehicle.findMany({
      where: {
        organizationId: org.id,
        deletedAt: null,
        status: 'AVAILABLE',
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        brand: true,
        model: true,
        year: true,
        salePriceCents: true,
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Novo lead</h1>
      <CreateLeadForm orgSlug={orgSlug} users={users} vehicles={vehicles} />
    </div>
  );
}
