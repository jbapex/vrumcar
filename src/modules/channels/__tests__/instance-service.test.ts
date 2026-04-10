import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import {
  ChannelInstanceLimitError,
  createChannelInstance,
  deleteChannelInstance,
  listChannelInstances,
} from '../instance-service';
import { createChannelInstanceSchema } from '../schemas';

const mockDisconnect = vi.fn();
const mockCreateInstance = vi.fn();
const mockSetWebhook = vi.fn();

vi.mock('../providers/uazapi/client', () => ({
  getAdminClient: vi.fn(() => ({
    createInstance: mockCreateInstance,
  })),
  getInstanceClient: vi.fn(() => ({
    disconnect: mockDisconnect,
    setWebhook: mockSetWebhook,
  })),
}));

describe('instance-service', () => {
  const createdOrgIds: string[] = [];

  afterAll(async () => {
    try {
      if (createdOrgIds.length > 0) {
        await prisma.organization.deleteMany({
          where: { id: { in: createdOrgIds } },
        });
      }
    } catch {
      // ignore
    }
    await prisma.$disconnect().catch(() => {});
  });

  beforeEach(() => {
    mockCreateInstance.mockReset();
    mockSetWebhook.mockReset();
    mockDisconnect.mockReset();
    mockDisconnect.mockResolvedValue({});
    mockSetWebhook.mockResolvedValue({});
  });

  async function createTestOrg(suffix: string) {
    const t = Date.now();
    const org = await prisma.organization.create({
      data: {
        slug: `ch-inst-${suffix}-${t}`,
        name: `Instance Org ${suffix} ${t}`,
      },
    });
    createdOrgIds.push(org.id);
    return org;
  }

  it('createChannelInstance lança erro se org excedeu limite', async () => {
    const org = await createTestOrg('limit');
    for (let i = 0; i < 3; i++) {
      await prisma.channelInstance.create({
        data: {
          organizationId: org.id,
          name: `Inst ${i}`,
          baseUrl: 'https://novo22.uazapi.com',
          webhookSecret: `w${org.id.slice(0, 6)}${i}`,
        },
      });
    }

    await expect(
      createChannelInstance(
        org.id,
        'user-1',
        createChannelInstanceSchema.parse({ name: 'Extra' }),
      ),
    ).rejects.toThrow(ChannelInstanceLimitError);

    expect(mockCreateInstance).not.toHaveBeenCalled();
  });

  it('deleteChannelInstance faz soft delete', async () => {
    const org = await createTestOrg('del');
    const row = await prisma.channelInstance.create({
      data: {
        organizationId: org.id,
        name: 'Del Me',
        baseUrl: 'https://novo22.uazapi.com',
        webhookSecret: 'whsec-del-test',
        encryptedToken: encrypt('fake-token'),
      },
    });

    await deleteChannelInstance(org.id, row.id);

    expect(mockDisconnect).toHaveBeenCalled();
    const updated = await prisma.channelInstance.findUnique({
      where: { id: row.id },
    });
    expect(updated?.deletedAt).toBeTruthy();
    expect(updated?.status).toBe('INACTIVE');
  });

  it('listChannelInstances retorna só não deletadas', async () => {
    const org = await createTestOrg('list');
    const a = await prisma.channelInstance.create({
      data: {
        organizationId: org.id,
        name: 'A',
        baseUrl: 'https://x',
        webhookSecret: 's1',
      },
    });
    await prisma.channelInstance.create({
      data: {
        organizationId: org.id,
        name: 'B',
        baseUrl: 'https://x',
        webhookSecret: 's2',
      },
    });
    await prisma.channelInstance.update({
      where: { id: a.id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });

    const list = await listChannelInstances(org.id);
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('B');
  });
});
