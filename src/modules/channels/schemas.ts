import { z } from 'zod';

export const channelProviderEnum = z.enum(['UAZAPI']);

export const channelInstanceStatusEnum = z.enum([
  'PENDING',
  'QR_REQUIRED',
  'CONNECTING',
  'CONNECTED',
  'DISCONNECTED',
  'ERROR',
  'INACTIVE',
]);

export const createChannelInstanceSchema = z.object({
  name: z.string().trim().min(2, 'Nome obrigatório').max(100),
  provider: channelProviderEnum.default('UAZAPI'),
});

export const sendTextMessageSchema = z.object({
  conversationId: z.string().min(1),
  text: z.string().trim().min(1, 'Mensagem não pode ser vazia').max(4096),
});

export const uazapiWebhookSchema = z.object({
  event: z.string(),
  instance: z.string(),
  data: z.record(z.string(), z.unknown()),
});

export type CreateChannelInstanceInput = z.infer<
  typeof createChannelInstanceSchema
>;
export type SendTextMessageInput = z.infer<typeof sendTextMessageSchema>;
export type UazapiWebhookInput = z.infer<typeof uazapiWebhookSchema>;
