/* eslint-disable @typescript-eslint/no-explicit-any -- Prisma $extends query extension args */
import { prisma } from './index';

/** Models com `organizationId` escopados pelo tenant helper. */
type TenantDelegateName =
  | 'subscription'
  | 'membership'
  | 'invitation'
  | 'vehicle'
  | 'vehiclePhoto'
  | 'vehicleCost'
  | 'vehiclePriceHistory'
  | 'lead'
  | 'leadInteraction'
  | 'customer'
  | 'sale'
  | 'channelInstance'
  | 'conversation'
  | 'message';

export class TenantNotFoundError extends Error {
  readonly model: string;

  readonly where: unknown;

  constructor(model: string, where: unknown) {
    super(
      `Record not found in tenant scope (model: ${model}, where: ${JSON.stringify(where)})`,
    );
    this.name = 'TenantNotFoundError';
    this.model = model;
    this.where = where;
  }
}

function mergeTenantWhereInput(
  where: Record<string, unknown> | undefined,
  organizationId: string,
): Record<string, unknown> {
  if (
    where === undefined ||
    (typeof where === 'object' && Object.keys(where).length === 0)
  ) {
    return { organizationId };
  }
  return { AND: [where, { organizationId }] };
}

function withTenantOrgId<T extends Record<string, unknown>>(
  data: T,
  organizationId: string,
): T & { organizationId: string } {
  return { ...data, organizationId };
}

/**
 * Valida no Prisma raw que existe exatamente um registro do model que
 * satisfaz o `where` único E pertence ao tenant. Usado antes de operações
 * que só aceitam WhereUniqueInput (não dá para injetar AND no root).
 */
async function assertBelongsToTenant(
  model: TenantDelegateName,
  where: Record<string, unknown> | undefined,
  organizationId: string,
): Promise<void> {
  if (!where || Object.keys(where).length === 0) {
    throw new TenantNotFoundError(model, where);
  }
  const scopedWhere = mergeTenantWhereInput(where, organizationId);
  const delegate = prisma[model] as unknown as {
    findFirst: (args: { where: Record<string, unknown> }) => Promise<unknown>;
  };
  const found = await delegate.findFirst({ where: scopedWhere });
  if (!found) {
    throw new TenantNotFoundError(model, where);
  }
}

function tenantModelExtension(
  organizationId: string,
  model: TenantDelegateName,
) {
  const orgId = organizationId;

  return {
    async findMany({ args, query }: any) {
      return query({
        ...args,
        where: mergeTenantWhereInput(args.where, orgId),
      });
    },

    async findFirst({ args, query }: any) {
      return query({
        ...args,
        where: mergeTenantWhereInput(args.where, orgId),
      });
    },

    async findFirstOrThrow({ args, query }: any) {
      return query({
        ...args,
        where: mergeTenantWhereInput(args.where, orgId),
      });
    },

    /**
     * findUnique: não podemos alterar o `where` (WhereUniqueInput).
     * Semântica: se o registro não existir OU não pertencer ao tenant →
     * TenantNotFoundError (não retorna null por tenant errado).
     */
    async findUnique({ args, query }: any) {
      await assertBelongsToTenant(model, args.where, orgId);
      return query(args);
    },

    async findUniqueOrThrow({ args, query }: any) {
      await assertBelongsToTenant(model, args.where, orgId);
      return query(args);
    },

    async create({ args, query }: any) {
      const data = args.data as Record<string, unknown>;
      return query({
        ...args,
        data: withTenantOrgId(data, orgId),
      });
    },

    async createMany({ args, query }: any) {
      const raw = args.data;
      if (Array.isArray(raw)) {
        return query({
          ...args,
          data: raw.map((row: Record<string, unknown>) =>
            withTenantOrgId(row, orgId),
          ),
        });
      }
      return query({
        ...args,
        data: withTenantOrgId(raw as Record<string, unknown>, orgId),
      });
    },

    async update({ args, query }: any) {
      await assertBelongsToTenant(model, args.where, orgId);
      const data = args.data as Record<string, unknown>;
      return query({
        ...args,
        data: withTenantOrgId(data, orgId),
      });
    },

    async updateMany({ args, query }: any) {
      const data = args.data as Record<string, unknown>;
      return query({
        ...args,
        where: mergeTenantWhereInput(args.where, orgId),
        data: withTenantOrgId(data, orgId),
      });
    },

    /**
     * upsert: o `where` é único; não dá para validar só com assert + findFirst
     * sem tratar o ramo de create. Fluxo:
     * - Se existe linha com esse where globalmente e organizationId ≠ tenant → erro.
     * - Caso contrário, delega com create/update sempre com organizationId do tenant.
     */
    async upsert({ args, query }: any) {
      const where = args.where as Record<string, unknown>;
      const delegate = prisma[model] as unknown as {
        findFirst: (args: {
          where: Record<string, unknown>;
        }) => Promise<{ organizationId: string } | null>;
      };
      const globalRow = await delegate.findFirst({ where });
      if (globalRow && globalRow.organizationId !== orgId) {
        throw new TenantNotFoundError(model, where);
      }
      const create = args.create as Record<string, unknown>;
      const update = args.update as Record<string, unknown>;
      return query({
        ...args,
        create: withTenantOrgId(create, orgId),
        update: withTenantOrgId(update, orgId),
      });
    },

    async delete({ args, query }: any) {
      await assertBelongsToTenant(model, args.where, orgId);
      return query(args);
    },

    async deleteMany({ args, query }: any) {
      return query({
        ...args,
        where: mergeTenantWhereInput(args.where, orgId),
      });
    },

    async count({ args, query }: any) {
      return query({
        ...args,
        where: mergeTenantWhereInput(args.where, orgId),
      });
    },

    async aggregate({ args, query }: any) {
      return query({
        ...args,
        where: mergeTenantWhereInput(args.where, orgId),
      });
    },

    async groupBy({ args, query }: any) {
      return query({
        ...args,
        where: mergeTenantWhereInput(args.where, orgId),
      });
    },
  };
}

/**
 * Cliente Prisma com escopo de tenant: injeta `organizationId` em queries e
 * mutações dos models `subscription`, `membership` e `invitation`.
 *
 * Operações com WhereUniqueInput validam o tenant com `findFirst` no cliente
 * raw antes de delegar, para não violar o tipo (sem AND no root do where).
 *
 * Veículos e anexos (fotos, custos, histórico de preço) seguem o mesmo padrão.
 */
export function getTenantPrisma(organizationId: string) {
  if (!organizationId?.trim()) {
    throw new Error('getTenantPrisma: organizationId is required');
  }

  const orgId = organizationId.trim();

  return prisma.$extends({
    query: {
      subscription: tenantModelExtension(orgId, 'subscription'),
      membership: tenantModelExtension(orgId, 'membership'),
      invitation: tenantModelExtension(orgId, 'invitation'),
      vehicle: tenantModelExtension(orgId, 'vehicle'),
      vehiclePhoto: tenantModelExtension(orgId, 'vehiclePhoto'),
      vehicleCost: tenantModelExtension(orgId, 'vehicleCost'),
      vehiclePriceHistory: tenantModelExtension(orgId, 'vehiclePriceHistory'),
      lead: tenantModelExtension(orgId, 'lead'),
      leadInteraction: tenantModelExtension(orgId, 'leadInteraction'),
      customer: tenantModelExtension(orgId, 'customer'),
      sale: tenantModelExtension(orgId, 'sale'),
      channelInstance: tenantModelExtension(orgId, 'channelInstance'),
      conversation: tenantModelExtension(orgId, 'conversation'),
      message: tenantModelExtension(orgId, 'message'),
    },
  });
}
