import type { Lead, OrgRole, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getTenantPrisma } from '@/lib/db/tenant';
import type {
  AddInteractionInput,
  CreateLeadInput,
  LeadFilters,
  UpdateLeadInput,
} from './schemas';

function omitUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).filter(
      ([, v]) => v !== undefined,
    ),
  ) as Partial<T>;
}

/**
 * Busca possíveis duplicatas de um lead por telefone ou email.
 * Retorna array vazio se nada encontrado. Nunca bloqueia criação —
 * é o chamador que decide o que fazer com os avisos.
 */
export async function findDuplicates(
  organizationId: string,
  params: { phone?: string | null; email?: string | null; cpf?: string | null },
): Promise<{ id: string; name: string; matchedOn: 'phone' | 'email' | 'cpf' }[]> {
  const db = getTenantPrisma(organizationId);
  const matches: {
    id: string;
    name: string;
    matchedOn: 'phone' | 'email' | 'cpf';
  }[] = [];

  if (params.phone) {
    const byPhone = await db.lead.findMany({
      where: { phone: params.phone, deletedAt: null },
      select: { id: true, name: true },
    });
    for (const l of byPhone) matches.push({ ...l, matchedOn: 'phone' });
  }

  if (params.email) {
    const byEmail = await db.lead.findMany({
      where: { email: params.email, deletedAt: null },
      select: { id: true, name: true },
    });
    for (const l of byEmail) {
      if (!matches.find((m) => m.id === l.id)) {
        matches.push({ ...l, matchedOn: 'email' });
      }
    }
  }

  if (params.cpf) {
    const byCpf = await db.lead.findMany({
      where: { cpf: params.cpf, deletedAt: null },
      select: { id: true, name: true },
    });
    for (const l of byCpf) {
      if (!matches.find((m) => m.id === l.id)) {
        matches.push({ ...l, matchedOn: 'cpf' });
      }
    }
  }

  return matches;
}

/**
 * Cria um novo lead. NÃO valida duplicatas aqui — isso fica no
 * chamador (Server Action) que pode chamar findDuplicates antes.
 */
export async function createLead(
  organizationId: string,
  userId: string,
  input: CreateLeadInput,
): Promise<Lead> {
  const db = getTenantPrisma(organizationId);

  const lead = await db.lead.create({
    data: {
      name: input.name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      cpf: input.cpf ?? null,
      source: input.source,
      sourceDetails: input.sourceDetails ?? null,
      status: input.status,
      priority: input.priority,
      tags: input.tags,
      assignedToId: input.assignedToId ?? null,
      interestVehicleId: input.interestVehicleId ?? null,
      interestDescription: input.interestDescription ?? null,
      hasTradeIn: input.hasTradeIn,
      tradeInDescription: input.tradeInDescription ?? null,
      budgetMinCents: input.budgetMinCents ?? null,
      budgetMaxCents: input.budgetMaxCents ?? null,
      organizationId,
      createdBy: userId,
    },
  });

  await db.leadInteraction.create({
    data: {
      organizationId,
      leadId: lead.id,
      type: 'NOTE',
      content: `Lead criado via ${input.source ?? 'OTHER'}`,
      createdBy: userId,
    },
  });

  return lead;
}

export async function updateLead(
  organizationId: string,
  userId: string,
  leadId: string,
  input: UpdateLeadInput,
): Promise<Lead> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.lead.findFirst({
      where: { id: leadId, organizationId, deletedAt: null },
    });
    if (!existing) throw new Error('Lead not found');

    const patch = omitUndefined(input) as UpdateLeadInput;

    if (
      patch.status !== undefined &&
      patch.status !== existing.status
    ) {
      await tx.leadInteraction.create({
        data: {
          organizationId,
          leadId,
          type: 'STATUS_CHANGE',
          content: `Status: ${existing.status} → ${patch.status}`,
          createdBy: userId,
        },
      });
    }

    if (
      patch.assignedToId !== undefined &&
      patch.assignedToId !== existing.assignedToId
    ) {
      await tx.leadInteraction.create({
        data: {
          organizationId,
          leadId,
          type: 'ASSIGNMENT',
          content: 'Atribuição alterada',
          createdBy: userId,
        },
      });
    }

    const data: Prisma.LeadUpdateInput = { ...patch };
    return tx.lead.update({
      where: { id: leadId },
      data,
    });
  });
}

export async function deleteLead(
  organizationId: string,
  leadId: string,
): Promise<void> {
  const db = getTenantPrisma(organizationId);
  await db.lead.update({
    where: { id: leadId },
    data: { deletedAt: new Date() },
  });
}

/**
 * Busca um lead por ID com todas as interações ordenadas.
 * Aplica filtro de ownership: se role é SALES, só retorna se
 * assignedToId === userId. MANAGER+ pode ver qualquer lead da org.
 */
export async function getLeadById(
  organizationId: string,
  leadId: string,
  viewer: { userId: string; role: OrgRole },
) {
  const db = getTenantPrisma(organizationId);

  const lead = await db.lead.findFirst({
    where: { id: leadId, deletedAt: null },
    include: {
      interactions: { orderBy: { createdAt: 'desc' } },
      assignedTo: { select: { id: true, name: true, email: true } },
      interestVehicle: {
        select: {
          id: true,
          brand: true,
          model: true,
          year: true,
          salePriceCents: true,
          status: true,
        },
      },
      customer: true,
    },
  });

  if (!lead) return null;

  if (viewer.role === 'SALES' && lead.assignedToId !== viewer.userId) {
    return null;
  }

  return lead;
}

/**
 * Lista leads com filtros + ownership.
 * Se viewer.role === 'SALES', filtra automaticamente pra só mostrar
 * leads atribuídos a ele.
 */
export async function listLeads(
  organizationId: string,
  filters: LeadFilters,
  viewer: { userId: string; role: OrgRole },
) {
  const db = getTenantPrisma(organizationId);

  const where: Prisma.LeadWhereInput = { deletedAt: null };

  if (viewer.role === 'SALES') {
    where.assignedToId = viewer.userId;
  }

  if (filters.search?.trim()) {
    const q = filters.search.trim();
    const digits = q.replace(/\D/g, '');
    const or: Prisma.LeadWhereInput[] = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ];
    if (digits.length > 0) {
      or.push({ phone: { contains: digits } });
    }
    where.OR = or;
  }

  if (filters.status) where.status = filters.status;
  if (filters.source) where.source = filters.source;
  if (filters.priority) where.priority = filters.priority;
  if (filters.assignedToId) where.assignedToId = filters.assignedToId;
  if (filters.tag) where.tags = { has: filters.tag };

  const orderBy = {
    [filters.orderBy]: filters.orderDir,
  } as Prisma.LeadOrderByWithRelationInput;

  const [total, items] = await Promise.all([
    db.lead.count({ where }),
    db.lead.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true } },
        interestVehicle: {
          select: { id: true, brand: true, model: true, year: true },
        },
      },
      orderBy,
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.ceil(total / filters.pageSize),
  };
}

export async function addInteraction(
  organizationId: string,
  userId: string,
  leadId: string,
  input: AddInteractionInput,
) {
  const db = getTenantPrisma(organizationId);

  const lead = await db.lead.findFirst({
    where: { id: leadId, deletedAt: null },
  });
  if (!lead) throw new Error('Lead not found');

  const interaction = await db.leadInteraction.create({
    data: {
      organizationId,
      leadId,
      type: input.type,
      content: input.content,
      metadata: input.metadata ?? undefined,
      createdBy: userId,
    },
  });

  const contactTypes = [
    'PHONE_CALL',
    'WHATSAPP_SENT',
    'WHATSAPP_RECEIVED',
    'EMAIL_SENT',
    'EMAIL_RECEIVED',
    'VISIT',
    'PROPOSAL_SENT',
  ];
  if (contactTypes.includes(input.type)) {
    await db.lead.update({
      where: { id: leadId },
      data: { lastContactAt: new Date() },
    });
  }

  return interaction;
}
