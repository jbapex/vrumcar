import { randomBytes } from 'node:crypto';
import type { ChannelInstance } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getTenantPrisma } from '@/lib/db/tenant';
import { encrypt, decrypt } from '@/lib/crypto';
import { getAdminClient, getInstanceClient } from './providers/uazapi/client';
import { UazapiError, type UazapiInstanceListItem } from './providers/uazapi/types';
import type { CreateChannelInstanceInput } from './schemas';

type TenantDb = ReturnType<typeof getTenantPrisma>;

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

function isInvalidTokenError(err: unknown): boolean {
  if (!(err instanceof UazapiError)) return false;
  return err.message.toLowerCase().includes('invalid token');
}

function buildUazapiInstanceName(
  organizationId: string,
  displayName: string,
): string {
  return `vrumcar-${organizationId.slice(0, 8)}-${displayName.toLowerCase().replace(/\s+/g, '-')}`;
}

function pickBestRemoteMatch(
  candidates: UazapiInstanceListItem[],
  preferredExternalId?: string | null,
): UazapiInstanceListItem | undefined {
  if (candidates.length === 0) return undefined;

  if (preferredExternalId) {
    const exact = candidates.find((i) => i.id === preferredExternalId);
    if (exact) return exact;
  }

  for (const status of ['connecting', 'disconnected', 'connected'] as const) {
    const match = candidates.find((i) => i.status === status);
    if (match) return match;
  }

  return candidates[0];
}

async function resolveRemoteInstance(
  adminClient: ReturnType<typeof getAdminClient>,
  instance: ChannelInstance,
): Promise<UazapiInstanceListItem | null> {
  const remoteInstances = await adminClient.listAllInstances();
  const expectedName = buildUazapiInstanceName(
    instance.organizationId,
    instance.name,
  );

  if (instance.externalId) {
    const byId = remoteInstances.find((i) => i.id === instance.externalId);
    if (byId?.token) return byId;
  }

  const byName = remoteInstances.filter((i) => i.name === expectedName);
  const picked = pickBestRemoteMatch(byName, instance.externalId);
  if (picked?.token) return picked;

  return null;
}

async function persistRemoteCredentials(
  db: TenantDb,
  channelInstanceId: string,
  remote: UazapiInstanceListItem,
  baseUrl: string,
): Promise<{ token: string; baseUrl: string }> {
  const encryptedToken = encrypt(remote.token);
  await db.channelInstance.update({
    where: { id: channelInstanceId },
    data: {
      externalId: remote.id,
      encryptedToken,
      baseUrl,
      lastError: null,
    },
  });
  return { token: remote.token, baseUrl };
}

async function configureInstanceWebhook(
  channelInstanceId: string,
  token: string,
  webhookSecret: string,
  baseUrl?: string,
): Promise<void> {
  try {
    const publicBaseUrl =
      process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000';
    const webhookUrl = `${publicBaseUrl}/api/webhooks/uazapi/${channelInstanceId}?secret=${webhookSecret}`;

    const instanceClient = getInstanceClient(token, baseUrl);
    await instanceClient.setWebhook({
      enabled: true,
      url: webhookUrl,
      events: ['messages', 'messages_update', 'connection'],
      excludeMessages: ['wasSentByApi'],
    });
  } catch (err) {
    console.error('[channels] Failed to configure webhook:', err);
  }
}

/**
 * Quando o token salvo expirou no uazapi, tenta recuperar pelo externalId
 * ou recria a instância remota mantendo o registro local.
 */
async function refreshOrReprovisionInstance(
  db: TenantDb,
  instance: ChannelInstance,
): Promise<{ token: string; baseUrl: string }> {
  const adminClient = getAdminClient();
  const baseUrl =
    instance.baseUrl ??
    process.env.UAZAPI_BASE_URL ??
    'https://novo22.uazapi.com';

  const remote = await resolveRemoteInstance(adminClient, instance);
  if (remote) {
    const credentials = await persistRemoteCredentials(
      db,
      instance.id,
      remote,
      baseUrl,
    );
    void configureInstanceWebhook(
      instance.id,
      remote.token,
      instance.webhookSecret,
      baseUrl,
    );
    return credentials;
  }

  let uazapiResponse;
  try {
    uazapiResponse = await adminClient.createInstance({
      name: buildUazapiInstanceName(instance.organizationId, instance.name),
      systemName: 'VrumCar',
    });
  } catch (err) {
    if (err instanceof UazapiError) {
      throw new ChannelInstanceError(
        `Erro ao recriar instância no provider: ${err.message}`,
      );
    }
    throw err;
  }

  const externalId = uazapiResponse.instance.id;
  const instanceToken = uazapiResponse.instance.token;

  if (!externalId || !instanceToken) {
    throw new ChannelInstanceError(
      'Resposta inválida do provider ao recriar instância',
    );
  }

  const encryptedToken = encrypt(instanceToken);
  await db.channelInstance.update({
    where: { id: instance.id },
    data: {
      externalId,
      encryptedToken,
      baseUrl,
      status: 'PENDING',
      lastError: null,
      phoneNumber: null,
      profileName: null,
      lastQrCode: null,
    },
  });

  void configureInstanceWebhook(
    instance.id,
    instanceToken,
    instance.webhookSecret,
    baseUrl,
  );

  return { token: instanceToken, baseUrl };
}

async function performConnect(
  db: TenantDb,
  channelInstanceId: string,
  token: string,
  baseUrl: string,
): Promise<{ qrCode: string | null; status: string }> {
  const client = getInstanceClient(token, baseUrl);
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
      name: buildUazapiInstanceName(organizationId, input.name),
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

  await configureInstanceWebhook(
    channelInstance.id,
    instanceToken,
    webhookSecret,
    baseUrl,
  );

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
  const baseUrl = instance.baseUrl;

  try {
    return await performConnect(db, channelInstanceId, token, baseUrl);
  } catch (err) {
    if (!isInvalidTokenError(err)) {
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

    try {
      const refreshed = await refreshOrReprovisionInstance(db, instance);
      return await performConnect(
        db,
        channelInstanceId,
        refreshed.token,
        refreshed.baseUrl,
      );
    } catch (refreshErr) {
      const message =
        refreshErr instanceof ChannelInstanceError
          ? refreshErr.message
          : refreshErr instanceof UazapiError
            ? refreshErr.message
            : 'Unknown error';
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
  const baseUrl = instance.baseUrl;
  const client = getInstanceClient(token, baseUrl);

  try {
    const result = await client.status();

    let newStatus: ChannelInstance['status'];
    if (result.status.connected && result.status.loggedIn) {
      newStatus = 'CONNECTED';
    } else if (result.instance.status === 'connecting') {
      newStatus = result.instance.qrcode ? 'QR_REQUIRED' : 'CONNECTING';
    } else if (!instance.lastConnectedAt && !instance.phoneNumber) {
      newStatus = 'PENDING';
    } else {
      // Qualquer estado que não seja conectado de fato → offline
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
        lastError: null,
      },
    });

    return updated;
  } catch (err) {
    if (isInvalidTokenError(err)) {
      return db.channelInstance.update({
        where: { id: channelInstanceId },
        data: {
          status: 'DISCONNECTED',
          lastError: 'Sessão expirada — clique em Reconectar',
        },
      });
    }

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
      const client = getInstanceClient(token, instance.baseUrl);
      await client.disconnect();
    } catch (err) {
      console.error('[channels] Failed to disconnect on delete:', err);
    }
  }

  const replacement = await db.channelInstance.findFirst({
    where: {
      organizationId,
      deletedAt: null,
      status: 'CONNECTED',
      id: { not: channelInstanceId },
    },
    orderBy: { lastConnectedAt: 'desc' },
  });

  if (replacement) {
    await db.conversation.updateMany({
      where: { channelInstanceId, deletedAt: null },
      data: { channelInstanceId: replacement.id },
    });
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

/**
 * Sincroniza status de todas as instâncias ativas com o uazapi.
 * Falhas individuais não impedem as demais.
 */
export async function syncAllChannelInstancesStatus(
  organizationId: string,
): Promise<ChannelInstance[]> {
  const instances = await listChannelInstances(organizationId);
  const synced = await Promise.all(
    instances.map(async (inst) => {
      if (!inst.encryptedToken) return inst;
      try {
        return await syncChannelInstanceStatus(organizationId, inst.id);
      } catch (err) {
        console.error(
          `[channels] Failed to sync instance ${inst.id}:`,
          err instanceof Error ? err.message : err,
        );
        return inst;
      }
    }),
  );
  return synced;
}
