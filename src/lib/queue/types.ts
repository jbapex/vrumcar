/**
 * Mapa tipado de fila -> payload do job.
 * Adicione aqui TODA fila nova com seu tipo de data.
 * Isso garante que createJob e worker são type-safe.
 */
export type QueueJobMap = {
  example: {
    message: string;
    organizationId: string;
  };
  // Filas futuras (comentadas, serão ativadas quando os módulos entrarem):
  // 'whatsapp-out': {
  //   organizationId: string;
  //   instanceId: string;
  //   conversationId: string;
  //   messageId: string;
  //   type: 'text' | 'media' | 'template';
  //   payload: Record<string, unknown>;
  // };
  // 'whatsapp-in': {
  //   webhookEventId: string;
  // };
  // 'automations-run': {
  //   organizationId: string;
  //   automationId: string;
  //   triggerPayload: Record<string, unknown>;
  // };
  // 'ai-execution': {
  //   organizationId: string;
  //   feature: string;
  //   contextPayload: Record<string, unknown>;
  // };
  // 'portals-sync': {
  //   organizationId: string;
  //   channelId: string;
  //   vehicleId: string;
  //   action: 'create' | 'update' | 'pause' | 'delete';
  // };
  // 'notifications': {
  //   organizationId: string;
  //   userId?: string;
  //   type: string;
  //   payload: Record<string, unknown>;
  // };
};

export type QueueName = keyof QueueJobMap;
export type QueueJobData<T extends QueueName> = QueueJobMap[T];
