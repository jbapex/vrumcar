import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PipelineBoard } from '@/components/pipeline/pipeline-board';
import { getPipelineData } from '@/modules/pipeline/pipeline-service';
import { notFound, redirect } from 'next/navigation';

interface Props {
  params: Promise<{ orgSlug: string }>;
}

export default async function PipelinePage({ params }: Props) {
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
  if (!org || org.memberships.length === 0) notFound();

  const role = org.memberships[0]!.role;
  const columns = await getPipelineData(org.id, {
    userId: session.user.id,
    userRole: role,
  });

  return (
    <div className="h-full min-h-0">
      <PipelineBoard orgSlug={orgSlug} columns={columns} />
    </div>
  );
}
