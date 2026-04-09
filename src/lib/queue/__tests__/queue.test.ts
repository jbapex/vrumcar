import { describe, it, expect, afterAll } from 'vitest';
import { addJob, getQueue } from '../index';
import { bullmqRedis } from '../connection';

describe('queue infrastructure', () => {
  afterAll(async () => {
    // Cleanup: limpa jobs de teste e fecha conexão
    const queue = getQueue('example');
    await queue.obliterate({ force: true });
    await queue.close();
    await bullmqRedis.quit();
  });

  it('getQueue retorna instância singleton (mesma referência)', () => {
    const q1 = getQueue('example');
    const q2 = getQueue('example');
    expect(q1).toBe(q2);
  });

  it('addJob enfileira um job com payload tipado', async () => {
    const job = await addJob('example', {
      message: 'test',
      organizationId: 'org-123',
    });
    expect(job.id).toBeDefined();
    expect(job.data.message).toBe('test');
    expect(job.data.organizationId).toBe('org-123');
  });

  it('addJob aceita delay opcional', async () => {
    const job = await addJob(
      'example',
      { message: 'delayed', organizationId: 'org-456' },
      { delay: 5000 },
    );
    expect(job.id).toBeDefined();
    const state = await job.getState();
    expect(['delayed', 'waiting']).toContain(state);
  });

  it('addJob com jobId customizado evita duplicação', async () => {
    const jobId = `unique-${Date.now()}`;
    const job1 = await addJob(
      'example',
      { message: 'first', organizationId: 'org-789' },
      { jobId },
    );
    const job2 = await addJob(
      'example',
      { message: 'second', organizationId: 'org-789' },
      { jobId },
    );
    // BullMQ retorna o mesmo job se jobId já existe
    expect(job2.id).toBe(job1.id);
  });
});
