import { InviteMemberDialog } from '@/components/settings/invite-member-dialog';
import { PendingInvitations } from '@/components/settings/pending-invitations';
import { TeamTable } from '@/components/settings/team-table';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ orgSlug: string }>;
}

export default async function TeamPage({ params }: Props) {
  const { orgSlug } = await params;

  const session = await auth();
  if (!session?.user?.id) notFound();

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
  });
  if (!org) notFound();

  const memberships = await prisma.membership.findMany({
    where: { organizationId: org.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      },
    },
    orderBy: [{ role: 'asc' }, { user: { name: 'asc' } }],
  });

  const members = memberships.map((m) => ({
    membershipId: m.id,
    userId: m.user.id,
    name: m.user.name,
    email: m.user.email,
    role: m.role,
    isActive: m.isActive,
    joinedAt: m.createdAt.toISOString(),
  }));

  const pendingInvitations = await prisma.invitation.findMany({
    where: {
      organizationId: org.id,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      invitedBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const invitations = pendingInvitations.map((inv) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    token: inv.token,
    expiresAt: inv.expiresAt.toISOString(),
    invitedBy: inv.invitedBy.name ?? inv.invitedBy.email,
    createdAt: inv.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Equipe</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {members.length}{' '}
            {members.length === 1 ? 'membro' : 'membros'}
          </p>
        </div>
        <InviteMemberDialog orgSlug={orgSlug} />
      </div>

      <PendingInvitations invitations={invitations} orgSlug={orgSlug} />

      <TeamTable
        members={members}
        orgSlug={orgSlug}
        currentUserId={session.user.id}
      />
    </div>
  );
}
