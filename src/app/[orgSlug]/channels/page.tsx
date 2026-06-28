import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { syncAllChannelInstancesStatus } from '@/modules/channels/instance-service';
import { CreateChannelDialog } from '@/components/channels/create-channel-dialog';
import { ChannelsTable } from '@/components/channels/channels-table';
import { DataListCard } from '@/components/layout/data-list-card';
import {
  ListPageEmpty,
  listPageSectionClass,
  listPageToolbarClass,
  listPageToolbarFieldsClass,
} from '@/components/layout/list-table';
import { PageHeader } from '@/components/layout/page-header';
import { LUCIDE_STROKE_THIN } from '@/lib/ui/lucide';
import { Smartphone } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';

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

  const instances = await syncAllChannelInstancesStatus(org.id);
  const used = instances.length;
  const max = org.maxChannelInstances;
  const canAdd = used < max;

  return (
    <div className={listPageSectionClass}>
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

      <DataListCard>
        <div className={listPageToolbarClass}>
          <div className={listPageToolbarFieldsClass}>
            <p className="text-xs text-muted-foreground md:pb-0.5">
              {used} de {max} instâncias em uso
              {!canAdd ? (
                <span className="text-muted-foreground/80">
                  {' '}
                  — limite atingido; entre em contato para ampliar seu plano.
                </span>
              ) : null}
            </p>
          </div>
        </div>

        {instances.length === 0 ? (
          <div className="p-4">
            <ListPageEmpty>
              <Smartphone
                className="size-12 opacity-50"
                strokeWidth={LUCIDE_STROKE_THIN}
                aria-hidden
              />
              <p className="max-w-md text-center text-sm">
                Nenhum canal de WhatsApp conectado. Use &quot;Conectar
                WhatsApp&quot; para vincular um número e começar a receber
                mensagens.
              </p>
            </ListPageEmpty>
          </div>
        ) : (
          <Suspense fallback={null}>
            <ChannelsTable orgSlug={orgSlug} instances={instances} />
          </Suspense>
        )}
      </DataListCard>
    </div>
  );
}
