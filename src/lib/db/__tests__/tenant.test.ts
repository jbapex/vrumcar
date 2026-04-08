import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../index';
import { getTenantPrisma, TenantNotFoundError } from '../tenant';

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

describe('getTenantPrisma', () => {
  let planId: string;
  let orgAId: string;
  let orgBId: string;
  let userAId: string;
  let userBId: string;
  let userCId: string;

  beforeAll(async () => {
    const plan = await prisma.plan.findFirst({ where: { slug: 'starter' } });
    if (!plan) {
      throw new Error('Seed plan "starter" ausente. Rode: pnpm prisma db seed');
    }
    planId = plan.id;

    const [orgA, orgB] = await Promise.all([
      prisma.organization.create({
        data: {
          slug: `tenant-test-a-${suffix}`,
          name: 'Tenant Test A',
        },
      }),
      prisma.organization.create({
        data: {
          slug: `tenant-test-b-${suffix}`,
          name: 'Tenant Test B',
        },
      }),
    ]);
    orgAId = orgA.id;
    orgBId = orgB.id;

    const [userA, userB, userC] = await Promise.all([
      prisma.user.create({
        data: {
          email: `tenant-test-a-${suffix}@test.local`,
          name: 'User A',
        },
      }),
      prisma.user.create({
        data: {
          email: `tenant-test-b-${suffix}@test.local`,
          name: 'User B',
        },
      }),
      prisma.user.create({
        data: {
          email: `tenant-test-c-${suffix}@test.local`,
          name: 'User C',
        },
      }),
    ]);
    userAId = userA.id;
    userBId = userB.id;
    userCId = userC.id;

    const periodStart = new Date();
    const periodEnd = new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000);

    await Promise.all([
      prisma.subscription.create({
        data: {
          organizationId: orgAId,
          planId,
          status: 'TRIALING',
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
      }),
      prisma.subscription.create({
        data: {
          organizationId: orgBId,
          planId,
          status: 'TRIALING',
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
      }),
    ]);

    await Promise.all([
      prisma.membership.create({
        data: {
          organizationId: orgAId,
          userId: userAId,
          role: 'OWNER',
        },
      }),
      prisma.membership.create({
        data: {
          organizationId: orgBId,
          userId: userBId,
          role: 'OWNER',
        },
      }),
    ]);
  });

  afterAll(async () => {
    try {
      await prisma.organization.deleteMany({
        where: {
          slug: { contains: suffix },
        },
      });
      await prisma.user.deleteMany({
        where: {
          email: { contains: suffix },
        },
      });
    } catch {
      // se beforeAll falhou (ex.: DB fora), ignora limpeza
    }
    await prisma.$disconnect().catch(() => {});
  });

  it('lança erro sem organizationId', () => {
    expect(() => getTenantPrisma('')).toThrow(
      'getTenantPrisma: organizationId is required',
    );
    expect(() => getTenantPrisma('   ')).toThrow(
      'getTenantPrisma: organizationId is required',
    );
  });

  it('findMany em subscription só retorna registros da org', async () => {
    const tenantA = getTenantPrisma(orgAId);
    const rows = await tenantA.subscription.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.organizationId).toBe(orgAId);

    const tenantB = getTenantPrisma(orgBId);
    const rowsB = await tenantB.subscription.findMany();
    expect(rowsB).toHaveLength(1);
    expect(rowsB[0]?.organizationId).toBe(orgBId);
  });

  it('create em membership injeta organizationId automaticamente', async () => {
    const tenantA = getTenantPrisma(orgAId);
    const created = await tenantA.membership.create({
      data: {
        userId: userCId,
        role: 'VIEWER',
        isActive: true,
      } as never,
    });
    expect(created.organizationId).toBe(orgAId);
  });

  it('create sobrescreve organizationId diferente do tenant', async () => {
    const tenantA = getTenantPrisma(orgAId);
    const dupUser = await prisma.user.create({
      data: {
        email: `tenant-test-d-${suffix}@test.local`,
        name: 'User D',
      },
    });
    const created = await tenantA.membership.create({
      data: {
        userId: dupUser.id,
        role: 'SALES',
        isActive: true,
        organizationId: orgBId,
      } as never,
    });
    expect(created.organizationId).toBe(orgAId);

    await prisma.user.delete({ where: { id: dupUser.id } });
    await prisma.membership.deleteMany({
      where: { userId: dupUser.id },
    });
  });

  it('update em membership só afeta registros da própria org', async () => {
    const tenantA = getTenantPrisma(orgAId);
    const mA = await prisma.membership.findFirstOrThrow({
      where: { organizationId: orgAId, userId: userAId },
    });
    const updated = await tenantA.membership.update({
      where: { id: mA.id },
      data: { isActive: false },
    });
    expect(updated.isActive).toBe(false);
    expect(updated.organizationId).toBe(orgAId);

    const mB = await prisma.membership.findFirstOrThrow({
      where: { organizationId: orgBId, userId: userBId },
    });
    const res = await tenantA.membership.updateMany({
      where: { id: mB.id },
      data: { isActive: false },
    });
    expect(res.count).toBe(0);

    const stillActive = await prisma.membership.findFirstOrThrow({
      where: { id: mB.id },
    });
    expect(stillActive.isActive).toBe(true);
  });

  it('update em membership de OUTRA org lança TenantNotFoundError', async () => {
    const mB = await prisma.membership.findFirstOrThrow({
      where: { organizationId: orgBId, userId: userBId },
    });
    const tenantA = getTenantPrisma(orgAId);
    try {
      await tenantA.membership.update({
        where: { id: mB.id },
        data: { isActive: false },
      });
      expect.fail('deveria lançar TenantNotFoundError');
    } catch (e) {
      expect(e).toBeInstanceOf(TenantNotFoundError);
      expect((e as Error).name).toBe('TenantNotFoundError');
      expect((e as Error).message).toMatch(/tenant scope/i);
    }
  });

  /**
   * findUnique: a extensão valida tenant antes de delegar; se o id existe
   * noutra org, assertBelongsToTenant falha → TenantNotFoundError (não null),
   * alinhado a "não expor existência cross-tenant".
   */
  it('findUnique em membership de OUTRA org lança TenantNotFoundError', async () => {
    const mB = await prisma.membership.findFirstOrThrow({
      where: { organizationId: orgBId, userId: userBId },
    });
    const tenantA = getTenantPrisma(orgAId);
    try {
      await tenantA.membership.findUnique({
        where: { id: mB.id },
      });
      expect.fail('deveria lançar TenantNotFoundError');
    } catch (e) {
      expect(e).toBeInstanceOf(TenantNotFoundError);
      expect((e as Error).name).toBe('TenantNotFoundError');
      expect((e as Error).message).toMatch(/tenant scope/i);
    }
  });

  it('delete em membership de OUTRA org lança TenantNotFoundError', async () => {
    const mB = await prisma.membership.findFirstOrThrow({
      where: { organizationId: orgBId, userId: userBId },
    });
    const tenantA = getTenantPrisma(orgAId);
    try {
      await tenantA.membership.delete({
        where: { id: mB.id },
      });
      expect.fail('deveria lançar TenantNotFoundError');
    } catch (e) {
      expect(e).toBeInstanceOf(TenantNotFoundError);
      expect((e as Error).name).toBe('TenantNotFoundError');
      expect((e as Error).message).toMatch(/tenant scope/i);
    }
  });
});
