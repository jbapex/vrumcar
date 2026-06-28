import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getDashboardMetrics } from '@/modules/dashboard/metrics-service';
import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ orgSlug: string }>;
}

export default async function DashboardPage({ params }: Props) {
  const { orgSlug } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      memberships: {
        where: { userId: session.user.id, isActive: true },
        take: 1,
      },
    },
  });

  if (!org || org.memberships.length === 0) redirect('/login');

  const metrics = await getDashboardMetrics(org.id);

  return (
    <DashboardContent
      orgSlug={orgSlug}
      orgName={org.name}
      metrics={metrics}
    />
  );
}
