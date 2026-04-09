import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';

const NO_ORG_MSG =
  'Nenhuma organização vinculada à sua conta. Entre em contato com o suporte.';

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      memberships: {
        where: { isActive: true },
        take: 1,
        orderBy: { createdAt: 'asc' },
        include: { organization: true },
      },
    },
  });

  const membership = user?.memberships[0];
  if (!membership) {
    redirect(`/login?error=${encodeURIComponent(NO_ORG_MSG)}`);
  }

  redirect(`/${membership.organization.slug}/dashboard`);
}
