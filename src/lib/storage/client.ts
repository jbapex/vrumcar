import { S3Client } from '@aws-sdk/client-s3';

const globalForS3 = globalThis as unknown as {
  s3Client?: S3Client;
};

function createClient(): S3Client {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION ?? 'us-east-1';
  const accessKey = process.env.S3_ACCESS_KEY;
  const secretKey = process.env.S3_SECRET_KEY;
  const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true';

  if (!accessKey || !secretKey) {
    throw new Error('S3_ACCESS_KEY and S3_SECRET_KEY are required');
  }

  return new S3Client({
    region,
    endpoint: endpoint || undefined,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
    forcePathStyle,
  });
}

export const s3Client = globalForS3.s3Client ?? createClient();
if (process.env.NODE_ENV !== 'production') {
  globalForS3.s3Client = s3Client;
}

export const S3_BUCKET = process.env.S3_BUCKET ?? 'vrumcar-photos';
export const S3_PUBLIC_URL =
  process.env.S3_PUBLIC_URL ?? 'http://localhost:9000/vrumcar-photos';
