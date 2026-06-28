import { redirect } from 'next/navigation';
import { SettingsNav } from '@/components/settings/settings-nav';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface Props {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}

export default async function SettingsLayout({ children, params }: Props) {
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
  if (!['OWNER', 'ADMIN'].includes(role)) {
    redirect(`/${orgSlug}/inbox`);
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Gerencie a organização e a equipe.
        </p>
      </div>
      <SettingsNav orgSlug={orgSlug} />
      {children}
    </div>
  );
}
