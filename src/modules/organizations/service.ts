import { OrgRole } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import slugify from 'slugify';
import { prisma } from '@/lib/db';
import type { SignupInput } from './schemas';

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

const TRIAL_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Gera slug único a partir do nome da loja: `slugify` + sufixo `-2`, `-3`, … se necessário.
 */
export async function generateUniqueSlug(
  name: string,
  tx: Prisma.TransactionClient,
): Promise<string> {
  const raw = slugify(name.trim(), { lower: true, strict: true });
  const base = raw.length > 0 ? raw : 'loja';

  let candidate = base;
  let suffix = 2;
  while (
    (await tx.organization.findUnique({ where: { slug: candidate } })) !==
    null
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function createOrganizationWithOwner(
  input: SignupInput,
): Promise<{ user: { id: string; email: string; name: string }; organization: { id: string; slug: string; name: string } }> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new ConflictError('Email já cadastrado');
    }

    const slug = await generateUniqueSlug(input.organizationName, tx);

    const plan = await tx.plan.findUnique({ where: { slug: 'starter' } });
    if (!plan) {
      throw new Error(
        'Plano starter não encontrado. Rode: pnpm prisma db seed',
      );
    }

    const now = new Date();
    const trialEndsAt = new Date(Date.now() + TRIAL_MS);
    const periodEnd = new Date(Date.now() + TRIAL_MS);

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await tx.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        emailVerified: now,
      },
    });

    const organization = await tx.organization.create({
      data: {
        slug,
        name: input.organizationName,
        trialEndsAt,
      },
    });

    await tx.subscription.create({
      data: {
        organizationId: organization.id,
        planId: plan.id,
        status: 'TRIALING',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    await tx.membership.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        role: OrgRole.OWNER,
        isActive: true,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      organization: {
        id: organization.id,
        slug: organization.slug,
        name: organization.name,
      },
    };
  });
}
