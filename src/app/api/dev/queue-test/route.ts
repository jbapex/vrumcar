import { NextResponse } from 'next/server';
import { addJob } from '@/lib/queue';

/**
 * Endpoint de DESENVOLVIMENTO pra testar a infra de filas.
 * Enfileira um job na fila 'example' e retorna o ID.
 *
 * Uso: GET /api/dev/queue-test
 *
 * Em produção, proteja ou remova esta rota.
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 404 },
    );
  }

  const job = await addJob('example', {
    message: 'Hello from VrumCar!',
    organizationId: 'test-org-id',
  });

  return NextResponse.json({
    ok: true,
    jobId: job.id,
    message: 'Job enfileirado. Veja o output do worker em outro terminal.',
  });
}
