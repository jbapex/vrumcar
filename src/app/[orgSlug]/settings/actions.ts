'use server';

import { revalidatePath } from 'next/cache';
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
