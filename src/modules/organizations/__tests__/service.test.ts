import { OrgRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { afterAll, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/db';
import {
  ConflictError,
  createOrganizationWithOwner,
} from '../service';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

describe('createOrganizationWithOwner', () => {
  const createdUserEmails: string[] = [];
  const createdOrgIds: string[] = [];

  afterAll(async () => {
    try {
      if (createdOrgIds.length > 0) {
        await prisma.organization.deleteMany({
          where: { id: { in: createdOrgIds } },
        });
      }
      if (createdUserEmails.length > 0) {
        await prisma.user.deleteMany({
          where: { email: { in: createdUserEmails } },
        });
      }
    } catch {
      // DB pode estar indisponível
    }
    await prisma.$disconnect().catch(() => {});
  });

  it('cria user, org, subscription e membership em transação', async () => {
    const t = Date.now();
    const email = `signup-svc-test-a-${t}@test.local`;
    createdUserEmails.push(email);

    const result = await createOrganizationWithOwner({
      name: 'Fulano Teste',
      email,
      password: 'senhaSegura1',
      organizationName: `Loja Alpha ${t}`,
    });

    createdOrgIds.push(result.organization.id);

    const user = await prisma.user.findUniqueOrThrow({
      where: { email },
    });
    const org = await prisma.organization.findUniqueOrThrow({
      where: { id: result.organization.id },
    });
    const sub = await prisma.subscription.findUniqueOrThrow({
      where: { organizationId: org.id },
    });
    const mem = await prisma.membership.findFirstOrThrow({
      where: { organizationId: org.id, userId: user.id },
    });

    expect(mem.role).toBe(OrgRole.OWNER);
    expect(mem.isActive).toBe(true);
    expect(sub.status).toBe('TRIALING');
    expect(org.trialEndsAt).not.toBeNull();
    const diffDays =
      (org.trialEndsAt!.getTime() - Date.now()) / MS_PER_DAY;
    expect(diffDays).toBeGreaterThanOrEqual(13.9);
    expect(diffDays).toBeLessThanOrEqual(14.1);
  });

  it('lança ConflictError se email já existe', async () => {
    const t = Date.now();
    const email = `signup-svc-test-b-${t}@test.local`;
    const plainPassword = 'senhaSegura1';

    await prisma.user.create({
      data: {
        email,
        name: 'Existente',
        passwordHash: await bcrypt.hash(plainPassword, 12),
      },
    });
    createdUserEmails.push(email);

    const orgCountBefore = await prisma.organization.count();

    await expect(
      createOrganizationWithOwner({
        name: 'Outro',
        email,
        password: 'outrasenha2',
        organizationName: `Loja Beta ${t}`,
      }),
    ).rejects.toThrow(ConflictError);

    const orgCountAfter = await prisma.organization.count();
    expect(orgCountAfter).toBe(orgCountBefore);
  });

  it('retorna slug com sufixo se base já existe', async () => {
    const t = Date.now();
    const email = `signup-svc-test-c-${t}@test.local`;
    createdUserEmails.push(email);

    await prisma.organization.deleteMany({
      where: { slug: { in: ['auto-loja', 'auto-loja-2'] } },
    });

    const blocking = await prisma.organization.create({
      data: {
        slug: 'auto-loja',
        name: `Bloqueia slug ${t}`,
      },
    });
    createdOrgIds.push(blocking.id);

    const result = await createOrganizationWithOwner({
      name: 'Dono Novo',
      email,
      password: 'senhaSegura1',
      organizationName: 'Auto Loja',
    });

    createdOrgIds.push(result.organization.id);
    expect(result.organization.slug).toBe('auto-loja-2');
  });

  it('password é hasheado com bcrypt, não salvo em texto puro', async () => {
    const t = Date.now();
    const email = `signup-svc-test-d-${t}@test.local`;
    const plainPassword = 'senhaSegura1';
    createdUserEmails.push(email);

    await createOrganizationWithOwner({
      name: 'Hash Test',
      email,
      password: plainPassword,
      organizationName: `Loja Hash ${t}`,
    });

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const org = await prisma.organization.findFirstOrThrow({
      where: { memberships: { some: { userId: user.id } } },
    });
    createdOrgIds.push(org.id);

    expect(user.passwordHash).not.toBe(plainPassword);
    expect(user.passwordHash).not.toBeNull();
    const ok = await bcrypt.compare(plainPassword, user.passwordHash!);
    expect(ok).toBe(true);
  });
});
