/**
 * Tipos do provider uazapi.
 * Baseado na spec OpenAPI oficial v2.0.1 de novo22.uazapi.com
 */

export interface UazapiInstanceCreatePayload {
  name: string;
  systemName?: string;
}

export interface UazapiInstanceCreateResponse {
  instance: {
    id: string;
    name: string;
    token: string;
    status: string;
    adminField01?: string;
    adminField02?: string;
  };
}

export interface UazapiConnectPayload {
  phone?: string;
}

export interface UazapiConnectResponse {
  connected: boolean;
  loggedIn: boolean;
  jid: object | null;
  instance: {
    id: string;
    name: string;
    status: string;
    qrcode?: string;
    paircode?: string;
  };
}

export interface UazapiStatusResponse {
  instance: {
    id: string;
    name: string;
    status: 'disconnected' | 'connecting' | 'connected';
    profileName?: string;
    qrcode?: string;
  };
  status: {
    connected: boolean;
    loggedIn: boolean;
    jid: {
      user: string;
      agent: number;
      device: number;
      server: string;
    } | null;
  };
}

export interface UazapiSendTextPayload {
  number: string;
  text: string;
  linkPreview?: boolean;
  delay?: number;
  readchat?: boolean;
}

export interface UazapiSendTextResponse {
  id: string;
  messageid: string;
  chatid: string;
  sender: string;
  messageType: string;
  text: string;
  messageTimestamp: number;
  status: string;
  response: {
    status: string;
    message: string;
  };
}

export interface UazapiWebhookPayload {
  enabled: boolean;
  url: string;
  events: Array<
    'connection' | 'history' | 'messages' | 'messages_update' | 'presence'
  >;
  excludeMessages?: Array<
    | 'wasSentByApi'
    | 'wasNotSentByApi'
    | 'fromMeYes'
    | 'fromMeNo'
    | 'isGroupYes'
    | 'isGroupNo'
  >;
}

/**
 * Payload REAL que o uazapi novo22.uazapi.com envia via webhook.
 * Validado via captura de webhook em produção (10/04/2026).
 *
 * NOTA: difere do documentado na spec OpenAPI v2.0.1 (que usa
 * 'event' + 'data'). Esse formato é o que o servidor real envia.
 *
 * Campos opcionais `event` / `data` mantêm compatibilidade com payloads
 * no formato antigo da spec.
 */
export interface UazapiIncomingWebhook {
  EventType?: string;
  BaseUrl?: string;
  instanceName?: string;
  owner?: string;
  token?: string;
  chatSource?: string;
  chat?: UazapiChatData;
  message?: UazapiMessageData;
  /** Spec OpenAPI antiga (camelCase) — fallback */
  event?: string;
  data?: UazapiMessageData | Record<string, unknown>;
}

export interface UazapiChatData {
  id?: string;
  name?: string;
  image?: string;
  imagePreview?: string;
  wa_chatid?: string;
  wa_isGroup?: boolean;
  wa_contactName?: string;
  wa_name?: string;
  wa_unreadCount?: number;
  phone?: string;
  [key: string]: unknown;
}

export interface UazapiMessageData {
  id?: string;
  messageid?: string;
  chatid?: string;
  sender?: string;
  senderName?: string;
  sender_pn?: string;
  sender_lid?: string;
  isGroup?: boolean;
  fromMe?: boolean;
  messageType?: string;
  mediaType?: string;
  messageTimestamp?: number;
  status?: string;
  text?: string;
  type?: string;
  wasSentByApi?: boolean;
  groupName?: string;
  content?: {
    text?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export class UazapiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public providerError?: unknown,
  ) {
    super(message);
    this.name = 'UazapiError';
  }
}
