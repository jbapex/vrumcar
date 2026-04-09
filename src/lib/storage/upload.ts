import {
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { nanoid } from 'nanoid';
import { s3Client, S3_BUCKET, S3_PUBLIC_URL } from './client';

/**
 * Policy que permite leitura anônima de objetos do bucket.
 * Uploads (PUT) continuam precisando de credenciais.
 * Isso resolve o ícone de imagem quebrada no <img>.
 */
function getPublicReadPolicy(bucket: string): string {
  return JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  });
}

/**
 * Garante que o bucket existe E que tem policy pública de leitura.
 * Idempotente: pode ser chamado várias vezes sem problema.
 *
 * Aplica a policy sempre (não só na criação) porque:
 * - É barato (uma chamada S3 PutBucketPolicy)
 * - Garante que buckets criados fora do código também tenham a policy
 * - Protege contra drift de configuração
 */
export async function ensureBucket(): Promise<void> {
  let bucketExisted = false;

  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
    bucketExisted = true;
  } catch {
    // Bucket não existe, cria
    try {
      await s3Client.send(new CreateBucketCommand({ Bucket: S3_BUCKET }));
      console.log(`[storage] Bucket '${S3_BUCKET}' created`);
    } catch (createErr) {
      console.error('[storage] Failed to create bucket:', createErr);
      throw createErr;
    }
  }

  // Aplica policy pública de leitura (idempotente)
  try {
    await s3Client.send(
      new PutBucketPolicyCommand({
        Bucket: S3_BUCKET,
        Policy: getPublicReadPolicy(S3_BUCKET),
      }),
    );
    if (!bucketExisted) {
      console.log(`[storage] Public read policy applied to '${S3_BUCKET}'`);
    }
  } catch (policyErr) {
    // Log mas não bloqueia — alguns providers S3 podem não aceitar
    // e o admin pode ter configurado manualmente
    console.warn(
      `[storage] Could not apply bucket policy (may already be set or provider restricts):`,
      policyErr instanceof Error ? policyErr.message : policyErr,
    );
  }
}

/**
 * Gera uma chave única pra um arquivo, organizada por tenant e recurso.
 * Exemplo: organizations/org_123/vehicles/veh_456/abc123.jpg
 */
export function generateStorageKey(params: {
  organizationId: string;
  vehicleId: string;
  originalName: string;
}): string {
  const ext = params.originalName.split('.').pop()?.toLowerCase() ?? 'bin';
  const id = nanoid(12);
  return `organizations/${params.organizationId}/vehicles/${params.vehicleId}/${id}.${ext}`;
}

/**
 * Faz upload de um buffer pro bucket e retorna a URL pública.
 */
export async function uploadBuffer(params: {
  key: string;
  buffer: Buffer;
  contentType: string;
}): Promise<{ url: string; key: string }> {
  await ensureBucket();

  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: params.key,
      Body: params.buffer,
      ContentType: params.contentType,
    }),
  );

  return {
    key: params.key,
    url: `${S3_PUBLIC_URL}/${params.key}`,
  };
}

/**
 * Remove um arquivo do bucket.
 */
export async function deleteObject(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    }),
  );
}
