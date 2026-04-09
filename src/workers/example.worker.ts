import { createWorker } from '@/lib/queue';

/**
 * Worker de exemplo. Processa jobs da fila 'example' e loga o payload.
 * Útil pra validar que a infra de filas tá funcionando.
 *
 * Rode com: pnpm worker:dev
 */
const worker = createWorker('example', async (job) => {
  console.log(`[example.worker] Processing job ${job.id}`);
  console.log(`[example.worker] Payload:`, job.data);

  // Simula algum trabalho
  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log(`[example.worker] Job ${job.id} completed`);
  return { ok: true, processedAt: new Date().toISOString() };
});

worker.on('completed', (job) => {
  console.log(`[example.worker] ✅ Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[example.worker] ❌ Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('[example.worker] Worker error:', err);
});

console.log('[example.worker] Started, waiting for jobs...');

// Graceful shutdown
const shutdown = async () => {
  console.log('[example.worker] Shutting down...');
  await worker.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
