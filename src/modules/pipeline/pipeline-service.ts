import { prisma } from '@/lib/db';
import type { LeadStatus } from '@prisma/client';

export interface PipelineCard {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
  source: string;
  estimatedValueCents: number | null;
  vehicleInterest: string | null;
  assignedTo: string | null;
  assignedToName: string | null;
  createdAt: string;
  updatedAt: string;
  daysSinceUpdate: number;
}

export interface PipelineColumn {
  status: string;
  label: string;
  color: string;
  cards: PipelineCard[];
  totalValueCents: number;
}

const PIPELINE_COLUMNS: Array<{
  status: LeadStatus;
  label: string;
  color: string;
}> = [
  { status: 'NEW', label: 'Novo', color: 'bg-blue-500' },
  { status: 'CONTACTED', label: 'Contatado', color: 'bg-sky-500' },
  { status: 'QUALIFIED', label: 'Qualificado', color: 'bg-amber-500' },
  {
    status: 'VISIT_SCHEDULED',
    label: 'Visita Agendada',
    color: 'bg-indigo-500',
  },
  {
    status: 'PROPOSAL_SENT',
    label: 'Proposta Enviada',
    color: 'bg-purple-500',
  },
  { status: 'NEGOTIATING', label: 'Negociando', color: 'bg-orange-500' },
  { status: 'WON', label: 'Ganho', color: 'bg-green-500' },
  { status: 'LOST', label: 'Perdido', color: 'bg-red-500' },
];

export { PIPELINE_COLUMNS };

export async function getPipelineData(
  organizationId: string,
  params: {
    userId?: string;
    userRole?: string;
  } = {},
): Promise<PipelineColumn[]> {
  const now = new Date();

  const where: Record<string, unknown> = {
    organizationId,
    deletedAt: null,
  };

  if (params.userRole === 'SALES' && params.userId) {
    where.assignedToId = params.userId;
  }

  const leads = await prisma.lead.findMany({
    where,
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return PIPELINE_COLUMNS.map((col) => {
    const cards = leads
      .filter((l) => l.status === col.status)
      .map((l) => ({
        id: l.id,
        name: l.name,
        phone: l.phone,
        email: l.email,
        status: l.status,
        source: l.source,
        estimatedValueCents: l.estimatedValueCents,
        vehicleInterest: l.interestDescription,
        assignedTo: l.assignedToId,
        assignedToName: l.assignedTo?.name ?? l.assignedTo?.email ?? null,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
        daysSinceUpdate: Math.floor(
          (now.getTime() - l.updatedAt.getTime()) / (1000 * 60 * 60 * 24),
        ),
      }));

    const totalValueCents = cards.reduce(
      (sum, c) => sum + (c.estimatedValueCents ?? 0),
      0,
    );

    return {
      status: col.status,
      label: col.label,
      color: col.color,
      cards,
      totalValueCents,
    };
  });
}
