'use server';

import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ensureBucket, uploadBuffer } from '@/lib/storage/upload';

async function requireAdminAccess(orgSlug: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Não autenticado');

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
    throw new Error('Sem acesso');
  }

  const membership = org.memberships[0];
  if (!membership) {
    throw new Error('Sem acesso');
  }

  const role = membership.role;
  if (!['OWNER', 'ADMIN'].includes(role)) {
    throw new Error('Apenas ADMIN ou OWNER podem alterar configurações');
  }

  return { org, userId: session.user.id, role };
}

export async function updateOrgAction(
  orgSlug: string,
  data: { name: string; slug: string },
) {
  const { org } = await requireAdminAccess(orgSlug);

  if (!data.name.trim()) {
    throw new Error('Nome é obrigatório');
  }

  const slugClean = data.slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');

  if (!slugClean || slugClean.length < 3) {
    throw new Error(
      'Slug deve ter pelo menos 3 caracteres (letras, números, hífens)',
    );
  }

  if (slugClean !== org.slug) {
    const existing = await prisma.organization.findUnique({
      where: { slug: slugClean },
    });
    if (existing) {
      throw new Error('Este slug já está em uso');
    }
  }

  await prisma.organization.update({
    where: { id: org.id },
    data: {
      name: data.name.trim(),
      slug: slugClean,
    },
  });

  if (slugClean !== orgSlug) {
    revalidatePath(`/${slugClean}/settings`);
    return { redirectTo: `/${slugClean}/settings` };
  }

  revalidatePath(`/${orgSlug}/settings`);
  return { redirectTo: null };
}

export async function uploadOrgLogoAction(
  orgSlug: string,
  formData: FormData,
) {
  const { org } = await requireAdminAccess(orgSlug);

  const file = formData.get('logo');
  if (!(file instanceof File)) {
    throw new Error('Nenhum arquivo enviado');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Apenas imagens são aceitas');
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Imagem muito grande (máximo 2MB)');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';

  await ensureBucket();

  const key = `orgs/${org.id}/logo.${ext}`;
  const { url } = await uploadBuffer({
    key,
    buffer,
    contentType: file.type,
  });

  await prisma.organization.update({
    where: { id: org.id },
    data: { logoUrl: url },
  });

  revalidatePath(`/${orgSlug}/settings`);
}

export async function createInvitationAction(
  orgSlug: string,
  data: { email: string; role: string },
) {
  const { org, userId } = await requireAdminAccess(orgSlug);

  const email = data.email.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    throw new Error('Email inválido');
  }

  const validRoles = ['SALES', 'MANAGER', 'ADMIN', 'FINANCE', 'VIEWER'];
  if (!validRoles.includes(data.role)) {
    throw new Error('Cargo inválido');
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUser) {
    const existingMembership = await prisma.membership.findFirst({
      where: {
        organizationId: org.id,
        userId: existingUser.id,
        isActive: true,
      },
    });
    if (existingMembership) {
      throw new Error('Este email já é membro da organização');
    }
  }

  const existingInvite = await prisma.invitation.findFirst({
    where: {
      organizationId: org.id,
      email,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (existingInvite) {
    throw new Error('Já existe um convite pendente para este email');
  }

  const invitation = await prisma.invitation.create({
    data: {
      organizationId: org.id,
      email,
      role: data.role as 'SALES' | 'MANAGER' | 'ADMIN' | 'FINANCE' | 'VIEWER',
      invitedById: userId,
      token: nanoid(32),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  revalidatePath(`/${orgSlug}/settings/team`);

  return { token: invitation.token };
}

export async function listPendingInvitationsAction(orgSlug: string) {
  const { org } = await requireAdminAccess(orgSlug);

  const invitations = await prisma.invitation.findMany({
    where: {
      organizationId: org.id,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      invitedBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return invitations.map((inv) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    token: inv.token,
    expiresAt: inv.expiresAt.toISOString(),
    invitedBy: inv.invitedBy.name ?? inv.invitedBy.email,
    createdAt: inv.createdAt.toISOString(),
  }));
}

export async function cancelInvitationAction(
  orgSlug: string,
  invitationId: string,
) {
  const { org } = await requireAdminAccess(orgSlug);

  await prisma.invitation.deleteMany({
    where: {
      id: invitationId,
      organizationId: org.id,
      acceptedAt: null,
    },
  });

  revalidatePath(`/${orgSlug}/settings/team`);
}

export async function listMembersAction(orgSlug: string) {
  const { org } = await requireAdminAccess(orgSlug);

  const memberships = await prisma.membership.findMany({
    where: { organizationId: org.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      },
    },
    orderBy: [{ role: 'asc' }, { user: { name: 'asc' } }],
  });

  return memberships.map((m) => ({
    membershipId: m.id,
    userId: m.user.id,
    name: m.user.name,
    email: m.user.email,
    role: m.role,
    isActive: m.isActive,
    joinedAt: m.createdAt,
    userCreatedAt: m.user.createdAt,
  }));
}
