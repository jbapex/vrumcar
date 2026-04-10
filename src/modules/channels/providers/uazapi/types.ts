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

export interface UazapiIncomingWebhook {
  event:
    | 'message'
    | 'status'
    | 'presence'
    | 'group'
    | 'connection'
    | 'messages'
    | 'messages_update';
  instance: string;
  data: UazapiMessageData | Record<string, unknown>;
}

export interface UazapiMessageData {
  id?: string;
  messageid?: string;
  chatid?: string;
  sender?: string;
  senderName?: string;
  isGroup?: boolean;
  fromMe?: boolean;
  messageType?: string;
  messageTimestamp?: number;
  status?: string;
  text?: string;
  wasSentByApi?: boolean;
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
