import type {
  ChannelInstanceStatus,
  ConversationStatus,
  MessageType,
} from '@prisma/client';

export const CHANNEL_STATUS_LABELS: Record<ChannelInstanceStatus, string> = {
  PENDING: 'Pendente',
  QR_REQUIRED: 'Aguardando QR Code',
  CONNECTING: 'Conectando...',
  CONNECTED: 'Conectado',
  DISCONNECTED: 'Desconectado',
  ERROR: 'Erro',
  INACTIVE: 'Inativo',
};

export const CONVERSATION_STATUS_LABELS: Record<ConversationStatus, string> = {
  OPEN: 'Aberta',
  PENDING: 'Aguardando',
  RESOLVED: 'Resolvida',
  ARCHIVED: 'Arquivada',
};

export const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
  TEXT: 'Texto',
  IMAGE: 'Imagem',
  AUDIO: 'Áudio',
  VIDEO: 'Vídeo',
  DOCUMENT: 'Documento',
  LOCATION: 'Localização',
  CONTACT: 'Contato',
  STICKER: 'Figurinha',
  SYSTEM: 'Sistema',
  UNKNOWN: 'Desconhecido',
};
