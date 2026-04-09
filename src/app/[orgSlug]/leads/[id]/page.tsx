import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ConvertToCustomerButton } from '@/components/leads/convert-to-customer-button';
import { DeleteLeadButton } from '@/components/leads/delete-lead-button';
import { EditLeadForm } from '@/components/leads/edit-lead-form';
import { LeadStatusSelect } from '@/components/leads/lead-status-select';
import { LeadTimeline } from '@/components/leads/lead-timeline';
import { LeadPriorityBadge } from '@/components/leads/priority-badge';
import { LeadStatusBadge } from '@/components/leads/status-badge';
import { buttonVariants } from '@/components/ui/button';
import { getLeadById } from '@/modules/leads/service';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

async function getLeadFormOptions(
  orgId: string,
  interestVehicleId: string | null,
) {
  const [users, vehiclesBase] = await Promise.all([
    prisma.user.findMany({
      where: {
        memberships: {
          some: { organizationId: orgId, isActive: true },
        },
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    }),
    prisma.vehicle.findMany({
      where: {
        organizationId: orgId,
        deletedAt: null,
        status: 'AVAILABLE',
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        brand: true,
        model: true,
        year: true,
        salePriceCents: true,
      },
    }),
  ]);

  const vehicles = [...vehiclesBase];
  if (interestVehicleId && !vehicles.some((v) => v.id === interestVehicleId)) {
    const extra = await prisma.vehicle.findFirst({
      where: {
        id: interestVehicleId,
        organizationId: orgId,
        deletedAt: null,
      },
      select: {
        id: true,
        brand: true,
        model: true,
        year: true,
        salePriceCents: true,
      },
    });
    if (extra) vehicles.push(extra);
  }

  return { users, vehicles };
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { orgSlug, id } = await params;

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

  const membership = org.memberships[0]!;
  const lead = await getLeadById(org.id, id, {
    userId: session.user.id,
    role: membership.role,
  });

  if (!lead) {
    notFound();
  }

  const creatorIds = [
    ...new Set(
      lead.interactions
        .map((i) => i.createdBy)
        .filter((x): x is string => Boolean(x)),
    ),
  ];
  const creators =
    creatorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: creatorIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
  const authorNames = Object.fromEntries(
    creators.map((u) => [u.id, u.name ?? u.email]),
  );

  const { users, vehicles } = await getLeadFormOptions(
    org.id,
    lead.interestVehicleId,
  );

  const hasCustomer = Boolean(lead.customerId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Lead: {lead.name}
            </h1>
            <LeadStatusBadge status={lead.status} />
            <LeadPriorityBadge priority={lead.priority} />
          </div>
          {hasCustomer && lead.customerId ? (
            <p className="text-muted-foreground text-sm">
              Cliente:{' '}
              <Link
                href={`/${orgSlug}/customers/${lead.customerId}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                Ver cadastro
              </Link>
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LeadStatusSelect
            orgSlug={orgSlug}
            leadId={lead.id}
            current={lead.status}
          />
          <ConvertToCustomerButton
            orgSlug={orgSlug}
            leadId={lead.id}
            disabled={hasCustomer}
          />
          <DeleteLeadButton orgSlug={orgSlug} leadId={lead.id} />
          <Link
            href={`/${orgSlug}/leads`}
            className={buttonVariants({ variant: 'outline' })}
          >
            Voltar à lista
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <EditLeadForm
            orgSlug={orgSlug}
            lead={{
              id: lead.id,
              name: lead.name,
              phone: lead.phone,
              email: lead.email,
              cpf: lead.cpf,
              source: lead.source,
              sourceDetails: lead.sourceDetails,
              status: lead.status,
              priority: lead.priority,
              assignedToId: lead.assignedToId,
              interestVehicleId: lead.interestVehicleId,
              interestDescription: lead.interestDescription,
              hasTradeIn: lead.hasTradeIn,
              tradeInDescription: lead.tradeInDescription,
              budgetMinCents: lead.budgetMinCents,
              budgetMaxCents: lead.budgetMaxCents,
            }}
            users={users}
            vehicles={vehicles}
          />
        </div>
        <div className="lg:col-span-1">
          <LeadTimeline
            orgSlug={orgSlug}
            leadId={lead.id}
            interactions={lead.interactions}
            authorNames={authorNames}
          />
        </div>
      </div>
    </div>
  );
}
