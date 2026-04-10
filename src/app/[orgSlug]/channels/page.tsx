import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { listChannelInstances } from '@/modules/channels/instance-service';
import { CreateChannelDialog } from '@/components/channels/create-channel-dialog';
import { ChannelCard } from '@/components/channels/channel-card';
import { DataListCard } from '@/components/layout/data-list-card';
import { PageHeader } from '@/components/layout/page-header';
import { notFound, redirect } from 'next/navigation';

export default async function ChannelsPage({
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

  const instances = await listChannelInstances(org.id);
  const used = instances.length;
  const max = org.maxChannelInstances;
  const canAdd = used < max;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        breadcrumbs={
          <>
            <span className="font-medium text-foreground">VrumCar</span>
            <span className="mx-1.5">/</span>
            <span>Canais</span>
          </>
        }
        title="Canais de atendimento"
        description="Conecte instâncias do WhatsApp para receber e responder mensagens no Atendimento."
      >
        {canAdd ? <CreateChannelDialog orgSlug={orgSlug} /> : null}
      </PageHeader>

      <DataListCard className="p-6">
        <p className="mb-6 text-center text-sm text-muted-foreground">
          {used} de {max} instâncias em uso
          {!canAdd ? (
            <span className="mt-1 block text-xs">
              Limite atingido — entre em contato para ampliar seu plano.
            </span>
          ) : null}
        </p>

        {instances.length === 0 ? (
          <div className="text-muted-foreground rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 py-16 text-center text-sm">
            Nenhum canal de WhatsApp conectado. Use &quot;Conectar WhatsApp&quot;
            pra começar.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1">
            {instances.map((inst) => (
              <ChannelCard key={inst.id} orgSlug={orgSlug} instance={inst} />
            ))}
          </div>
        )}
      </DataListCard>
    </div>
  );
}
