import {
  Queue,
  Worker,
  type Processor,
  type WorkerOptions,
} from 'bullmq';
import { bullmqRedis } from './connection';
import type { QueueName, QueueJobData } from './types';

const queueInstances = new Map<QueueName, Queue>();

/**
 * Retorna (ou cria) a instância singleton de uma Queue.
 * Use SEMPRE esta função, nunca instancie Queue diretamente.
 */
export function getQueue<T extends QueueName>(
  name: T,
): Queue<QueueJobData<T>, unknown, T> {
  let instance = queueInstances.get(name);
  if (!instance) {
    // Terceiro genérico = nome do job (deve coincidir com queueName) para `add()` ser type-safe no BullMQ 5.
    instance = new Queue<QueueJobData<T>, unknown, T>(name, {
      connection: bullmqRedis,
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000, // 5s, 10s, 20s, 40s, 80s
        },
        removeOnComplete: { age: 3600, count: 1000 }, // 1h ou últimos 1000
        removeOnFail: { age: 86400 * 7 }, // 7 dias
      },
    });
    queueInstances.set(name, instance);
  }
  return instance as Queue<QueueJobData<T>, unknown, T>;
}

/**
 * Helper pra adicionar um job a uma fila de forma type-safe.
 * O payload é validado em tempo de compilação contra QueueJobMap.
 */
export async function addJob<T extends QueueName>(
  queueName: T,
  data: QueueJobData<T>,
  opts?: { delay?: number; jobId?: string },
) {
  const queue = getQueue(queueName);
  // BullMQ 5: `add()` generics (ExtractDataType / ExtractNameType) não fecham com `T` genérico; payload continua type-safe via `QueueJobMap`.
  // @ts-expect-error — alinhamento com BullMQ 5 + generic T (ver comentário acima)
  return queue.add(queueName, data, opts);
}

/**
 * Helper pra criar um Worker tipado. Use no entry point dos workers.
 */
export function createWorker<T extends QueueName>(
  name: T,
  processor: Processor<QueueJobData<T>>,
  opts?: Partial<WorkerOptions>,
) {
  return new Worker<QueueJobData<T>, unknown, T>(name, processor, {
    connection: bullmqRedis,
    concurrency: 5,
    ...opts,
  });
}
