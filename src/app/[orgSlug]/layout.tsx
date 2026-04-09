import { AppShell } from '@/components/layout/app-shell';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';

export default async function OrgSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

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

  const membership = org.memberships[0];
  if (!membership) {
    notFound();
  }

  const userName = session.user.name ?? '';
  const userEmail = session.user.email ?? '';

  return (
    <AppShell
      orgSlug={orgSlug}
      orgName={org.name}
      userRole={membership.role}
      userName={userName}
      userEmail={userEmail}
    >
      {children}
    </AppShell>
  );
}
