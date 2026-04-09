import { Redis } from 'ioredis';

const globalForRedis = globalThis as unknown as {
  bullmqRedis?: Redis;
};

export const bullmqRedis =
  globalForRedis.bullmqRedis ??
  new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: null, // BullMQ exige null
    enableReadyCheck: false,
    lazyConnect: true, // evita abrir TCP na import do módulo (ex.: `next build`)
  });

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.bullmqRedis = bullmqRedis;
}
