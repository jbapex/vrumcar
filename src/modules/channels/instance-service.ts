import { randomBytes } from 'node:crypto';
import type { ChannelInstance } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getTenantPrisma } from '@/lib/db/tenant';
import { encrypt, decrypt } from '@/lib/crypto';
import { getAdminClient, getInstanceClient } from './providers/uazapi/client';
import { UazapiError } from './providers/uazapi/types';
import type { CreateChannelInstanceInput } from './schemas';

export class ChannelInstanceLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChannelInstanceLimitError';
  }
}

export class ChannelInstanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChannelInstanceError';
  }
}

export async function createChannelInstance(
  organizationId: string,
  userId: string,
  input: CreateChannelInstanceInput,
): Promise<ChannelInstance> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { maxChannelInstances: true },
  });
  if (!org) throw new ChannelInstanceError('Organization not found');

  const db = getTenantPrisma(organizationId);
  const activeCount = await db.channelInstance.count({
    where: { deletedAt: null },
  });

  if (activeCount >= org.maxChannelInstances) {
    throw new ChannelInstanceLimitError(
      `Limite de ${org.maxChannelInstances} instâncias de canal atingido`,
    );
  }

  const adminClient = getAdminClient();
  let uazapiResponse;
  try {
    uazapiResponse = await adminClient.createInstance({
      name: `vrumcar-${organizationId.slice(0, 8)}-${input.name.toLowerCase().replace(/\s+/g, '-')}`,
      systemName: 'VrumCar',
    });
  } catch (err) {
    if (err instanceof UazapiError) {
      throw new ChannelInstanceError(
        `Erro ao criar instância no provider: ${err.message}`,
      );
    }
    throw err;
  }

  const externalId = uazapiResponse.instance.id;
  const instanceToken = uazapiResponse.instance.token;

  if (!externalId || !instanceToken) {
    throw new ChannelInstanceError(
      'Resposta inválida do provider (faltando id ou token)',
    );
  }

  const encryptedToken = encrypt(instanceToken);
  const webhookSecret = randomBytes(32).toString('hex');

  const baseUrl =
    process.env.UAZAPI_BASE_URL ?? 'https://novo22.uazapi.com';
  const channelInstance = await db.channelInstance.create({
    data: {
      organizationId,
      name: input.name,
      provider: input.provider,
      externalId,
      baseUrl,
      encryptedToken,
      webhookSecret,
      status: 'PENDING',
      createdBy: userId,
    },
  });

  try {
    const publicBaseUrl =
      process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000';
    const webhookUrl = `${publicBaseUrl}/api/webhooks/uazapi/${channelInstance.id}?secret=${webhookSecret}`;

    const instanceClient = getInstanceClient(instanceToken);
    await instanceClient.setWebhook({
      enabled: true,
      url: webhookUrl,
      events: ['messages', 'messages_update', 'connection'],
      excludeMessages: ['wasSentByApi'],
    });
  } catch (err) {
    console.error('[channels] Failed to configure webhook:', err);
  }

  return channelInstance;
}

export async function connectChannelInstance(
  organizationId: string,
  channelInstanceId: string,
): Promise<{ qrCode: string | null; status: string }> {
  const db = getTenantPrisma(organizationId);
  const instance = await db.channelInstance.findFirst({
    where: { id: channelInstanceId, deletedAt: null },
  });
  if (!instance) throw new ChannelInstanceError('Channel instance not found');
  if (!instance.encryptedToken) {
    throw new ChannelInstanceError('Instance has no token configured');
  }

  const token = decrypt(instance.encryptedToken);
  const client = getInstanceClient(token);

  try {
    const result = await client.connect({});
    const qrCode = result.instance.qrcode ?? null;

    await db.channelInstance.update({
      where: { id: channelInstanceId },
      data: {
        status: qrCode ? 'QR_REQUIRED' : 'CONNECTING',
        lastQrCode: qrCode,
        lastError: null,
      },
    });

    return {
      qrCode,
      status: result.instance.status,
    };
  } catch (err) {
    const message =
      err instanceof UazapiError ? err.message : 'Unknown error';
    await db.channelInstance.update({
      where: { id: channelInstanceId },
      data: {
        status: 'ERROR',
        lastError: message,
      },
    });
    throw new ChannelInstanceError(`Erro ao conectar: ${message}`);
  }
}

export async function syncChannelInstanceStatus(
  organizationId: string,
  channelInstanceId: string,
): Promise<ChannelInstance> {
  const db = getTenantPrisma(organizationId);
  const instance = await db.channelInstance.findFirst({
    where: { id: channelInstanceId, deletedAt: null },
  });
  if (!instance || !instance.encryptedToken) {
    throw new ChannelInstanceError('Instance not found or has no token');
  }

  const token = decrypt(instance.encryptedToken);
  const client = getInstanceClient(token);

  try {
    const result = await client.status();

    let newStatus: ChannelInstance['status'] = instance.status;
    if (result.status.connected && result.status.loggedIn) {
      newStatus = 'CONNECTED';
    } else if (result.instance.status === 'connecting') {
      newStatus = result.instance.qrcode ? 'QR_REQUIRED' : 'CONNECTING';
    } else if (result.instance.status === 'disconnected') {
      newStatus = 'DISCONNECTED';
    }

    const updated = await db.channelInstance.update({
      where: { id: channelInstanceId },
      data: {
        status: newStatus,
        lastQrCode: result.instance.qrcode ?? null,
        phoneNumber: result.status.jid?.user ?? instance.phoneNumber,
        profileName: result.instance.profileName ?? instance.profileName,
        lastConnectedAt:
          newStatus === 'CONNECTED' && instance.status !== 'CONNECTED'
            ? new Date()
            : instance.lastConnectedAt,
      },
    });

    return updated;
  } catch (err) {
    const message =
      err instanceof UazapiError ? err.message : 'Unknown error';
    throw new ChannelInstanceError(`Erro ao sincronizar status: ${message}`);
  }
}

export async function deleteChannelInstance(
  organizationId: string,
  channelInstanceId: string,
): Promise<void> {
  const db = getTenantPrisma(organizationId);
  const instance = await db.channelInstance.findFirst({
    where: { id: channelInstanceId, deletedAt: null },
  });
  if (!instance) throw new ChannelInstanceError('Channel instance not found');

  if (instance.encryptedToken) {
    try {
      const token = decrypt(instance.encryptedToken);
      const client = getInstanceClient(token);
      await client.disconnect();
    } catch (err) {
      console.error('[channels] Failed to disconnect on delete:', err);
    }
  }

  await db.channelInstance.update({
    where: { id: channelInstanceId },
    data: { deletedAt: new Date(), status: 'INACTIVE' },
  });
}

export async function listChannelInstances(
  organizationId: string,
): Promise<ChannelInstance[]> {
  const db = getTenantPrisma(organizationId);
  return db.channelInstance.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
}
