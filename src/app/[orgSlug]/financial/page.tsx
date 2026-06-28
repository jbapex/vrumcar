import { FinancialContent } from '@/components/financial/financial-content';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getFinancialData } from '@/modules/financial/financial-service';
import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ orgSlug: string }>;
}

export default async function FinancialPage({ params }: Props) {
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

  const membership = org.memberships[0];
  if (!membership) redirect('/login');

  const role = membership.role;
  if (!['OWNER', 'ADMIN', 'FINANCE'].includes(role)) {
    redirect(`/${orgSlug}/dashboard`);
  }

  const data = await getFinancialData(org.id);

  return <FinancialContent orgSlug={orgSlug} data={data} />;
}
