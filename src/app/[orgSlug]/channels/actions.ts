'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  ChannelInstanceError,
  ChannelInstanceLimitError,
  connectChannelInstance,
  createChannelInstance,
  deleteChannelInstance,
  syncChannelInstanceStatus,
} from '@/modules/channels/instance-service';
import { createChannelInstanceSchema } from '@/modules/channels/schemas';

async function requireOrgAccess(orgSlug: string) {
  const session = await auth();
  if (!session?.user) redirect('/login');

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
    throw new Error('Forbidden');
  }
  const membership = org.memberships[0];
  if (!membership) throw new Error('Forbidden');
  return {
    org,
    userId: session.user.id,
    role: membership.role,
  };
}

export async function createChannelInstanceAction(
  orgSlug: string,
  formData: FormData,
) {
  const { org, userId } = await requireOrgAccess(orgSlug);

  const raw = Object.fromEntries(formData.entries());
  const parsed = createChannelInstanceSchema.safeParse({
    name: raw.name,
    provider: 'UAZAPI',
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Dados inválidos');
  }

  try {
    const instance = await createChannelInstance(org.id, userId, parsed.data);
    revalidatePath(`/${orgSlug}/channels`);
    return { ok: true as const, instanceId: instance.id };
  } catch (err) {
    if (err instanceof ChannelInstanceLimitError) {
      throw new Error(err.message);
    }
    if (err instanceof ChannelInstanceError) {
      throw new Error(err.message);
    }
    throw new Error('Erro ao criar instância');
  }
}

export async function connectChannelInstanceAction(
  orgSlug: string,
  instanceId: string,
) {
  const { org } = await requireOrgAccess(orgSlug);

  try {
    const result = await connectChannelInstance(org.id, instanceId);
    revalidatePath(`/${orgSlug}/channels`);
    return result;
  } catch (err) {
    if (err instanceof ChannelInstanceError) {
      throw new Error(err.message);
    }
    throw new Error('Erro ao conectar');
  }
}

export async function syncChannelInstanceStatusAction(
  orgSlug: string,
  instanceId: string,
) {
  const { org } = await requireOrgAccess(orgSlug);

  try {
    const updated = await syncChannelInstanceStatus(org.id, instanceId);
    revalidatePath(`/${orgSlug}/channels`);
    return {
      status: updated.status,
      qrCode: updated.lastQrCode,
      phoneNumber: updated.phoneNumber,
      profileName: updated.profileName,
    };
  } catch (err) {
    if (err instanceof ChannelInstanceError) {
      throw new Error(err.message);
    }
    throw new Error('Erro ao sincronizar');
  }
}

export async function deleteChannelInstanceAction(
  orgSlug: string,
  instanceId: string,
) {
  const { org } = await requireOrgAccess(orgSlug);

  await deleteChannelInstance(org.id, instanceId);
  revalidatePath(`/${orgSlug}/channels`);
}
