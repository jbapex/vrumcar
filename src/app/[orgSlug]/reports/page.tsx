import { ReportsContent } from '@/components/reports/reports-content';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getReportsData } from '@/modules/reports/reports-service';
import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ year?: string; month?: string }>;
}

export default async function ReportsPage({ params, searchParams }: Props) {
  const { orgSlug } = await params;
  const sp = await searchParams;

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

  const now = new Date();
  const year = sp.year ? parseInt(sp.year, 10) : now.getFullYear();
  const month = sp.month ? parseInt(sp.month, 10) : now.getMonth() + 1;

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const membership = org.memberships[0];
  if (!membership) redirect('/login');

  const data = await getReportsData(org.id, {
    startDate,
    endDate,
    userId: session.user.id,
    userRole: membership.role,
  });

  return (
    <ReportsContent orgSlug={orgSlug} data={data} year={year} month={month} />
  );
}
