import { Buffer } from 'node:buffer';
import type { Message } from '@prisma/client';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { uploadBuffer, ensureBucket } from '@/lib/storage/upload';
import { getInstanceClient } from './providers/uazapi/client';
import { UazapiError } from './providers/uazapi/types';

export class MediaDownloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MediaDownloadError';
  }
}

/**
 * Baixa uma mídia do uazapi e salva no MinIO.
 * Atualiza a Message com a URL pública e metadata.
 *
 * Idempotente: se a mensagem já tem mediaUrl, retorna sem fazer
 * nada (cache hit).
 *
 * NÃO usa tenant scope porque é chamada de dentro da rota API
 * que valida acesso antes.
 */
export async function downloadAndCacheMedia(
  messageId: string,
): Promise<Message> {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      conversation: {
        include: { channelInstance: true },
      },
    },
  });

  if (!message) {
    throw new MediaDownloadError('Message not found');
  }

  if (message.mediaUrl) {
    return message;
  }

  if (!message.externalMessageId) {
    throw new MediaDownloadError('Message has no external ID for download');
  }

  const validTypes = ['IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT'];
  if (!validTypes.includes(message.type)) {
    throw new MediaDownloadError(
      `Cannot download media of type ${message.type}`,
    );
  }

  const channelInstance = message.conversation.channelInstance;
  if (!channelInstance.encryptedToken) {
    throw new MediaDownloadError('Channel instance has no token');
  }

  const token = decrypt(channelInstance.encryptedToken);
  const client = getInstanceClient(token);

  let downloadResponse;
  try {
    downloadResponse = await client.downloadMedia(message.externalMessageId);
  } catch (err) {
    if (err instanceof UazapiError) {
      throw new MediaDownloadError(`Provider error: ${err.message}`);
    }
    throw err;
  }

  let buffer: Buffer | null = null;
  let mimeType =
    (downloadResponse.mimetype as string | undefined) ??
    'application/octet-stream';

  if (downloadResponse.base64) {
    const raw = downloadResponse.base64 as string;
    const base64Clean = raw.replace(/^data:[^;]+;base64,/, '');
    buffer = Buffer.from(base64Clean, 'base64');
  } else if (downloadResponse.fileURL) {
    const fileResp = await fetch(downloadResponse.fileURL);
    if (!fileResp.ok) {
      throw new MediaDownloadError(
        `Failed to download from fileURL: HTTP ${fileResp.status}`,
      );
    }
    const arrayBuffer = await fileResp.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);

    const headerMime = fileResp.headers.get('content-type');
    if (headerMime && !downloadResponse.mimetype) {
      mimeType = headerMime;
    }
  }

  if (!buffer) {
    throw new MediaDownloadError('No media content in download response');
  }

  const extMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
    'audio/mp4': 'm4a',
    'video/mp4': 'mp4',
    'application/pdf': 'pdf',
  };
  const mimeKey = mimeType.split(';')[0]?.trim() ?? mimeType;
  const ext = extMap[mimeKey] ?? 'bin';
  const fileName =
    (downloadResponse.filename as string | undefined) ??
    `${message.id}.${ext}`;

  await ensureBucket();

  const key = `whatsapp/${message.organizationId}/${message.conversationId}/${message.id}.${ext}`;
  const uploadResult = await uploadBuffer({
    key,
    buffer,
    contentType: mimeType,
  });

  const updated = await prisma.message.update({
    where: { id: message.id },
    data: {
      mediaUrl: uploadResult.url,
      mediaMimeType: mimeType,
      mediaSizeBytes: buffer.length,
      mediaFileName: fileName,
    },
  });

  return updated;
}
