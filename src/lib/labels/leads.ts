import type {
  LeadInteractionType,
  LeadSource,
  LeadStatus,
} from '@prisma/client';

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'Novo',
  CONTACTED: 'Contatado',
  QUALIFIED: 'Qualificado',
  VISITING: 'Em visita',
  NEGOTIATING: 'Negociando',
  WON: 'Ganhou',
  LOST: 'Perdeu',
  ARCHIVED: 'Arquivado',
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  WHATSAPP: 'WhatsApp',
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  WEBMOTORS: 'Webmotors',
  OLX: 'OLX',
  ICARROS: 'iCarros',
  MERCADO_LIVRE: 'Mercado Livre',
  WEBSITE: 'Site próprio',
  WALK_IN: 'Visita à loja',
  PHONE: 'Telefone',
  REFERRAL: 'Indicação',
  OTHER: 'Outro',
};

export const INTERACTION_TYPE_LABELS: Record<LeadInteractionType, string> = {
  NOTE: 'Nota',
  PHONE_CALL: 'Ligação',
  WHATSAPP_SENT: 'WhatsApp enviado',
  WHATSAPP_RECEIVED: 'WhatsApp recebido',
  EMAIL_SENT: 'Email enviado',
  EMAIL_RECEIVED: 'Email recebido',
  VISIT: 'Visita',
  PROPOSAL_SENT: 'Proposta enviada',
  TEST_DRIVE: 'Test drive',
  STATUS_CHANGE: 'Mudança de status',
  ASSIGNMENT: 'Atribuição',
};
