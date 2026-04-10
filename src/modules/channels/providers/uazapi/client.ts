import type {
  UazapiConnectPayload,
  UazapiConnectResponse,
  UazapiInstanceCreatePayload,
  UazapiInstanceCreateResponse,
  UazapiSendTextPayload,
  UazapiSendTextResponse,
  UazapiStatusResponse,
  UazapiWebhookPayload,
} from './types';
import { UazapiError } from './types';

/**
 * Cliente HTTP do uazapi.
 * Encapsula chamadas à API e padroniza erros.
 */
export class UazapiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
    private readonly tokenType: 'instance' | 'admin' = 'instance',
  ) {}

  private async request<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl.replace(/\/$/, '')}${path}`;
    const headerName = this.tokenType === 'admin' ? 'admintoken' : 'token';

    const headers: Record<string, string> = {
      [headerName]: this.token,
      'Content-Type': 'application/json',
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      throw new UazapiError(
        `Network error calling ${path}: ${err instanceof Error ? err.message : 'unknown'}`,
        0,
      );
    }

    const text = await response.text();
    let parsed: unknown = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      // Resposta não é JSON
    }

    if (!response.ok) {
      const errorMessage =
        (parsed as { error?: string; message?: string })?.error ??
        (parsed as { message?: string })?.message ??
        `HTTP ${response.status}: ${text.slice(0, 200)}`;
      throw new UazapiError(errorMessage, response.status, parsed);
    }

    return parsed as T;
  }

  async createInstance(
    payload: UazapiInstanceCreatePayload,
  ): Promise<UazapiInstanceCreateResponse> {
    if (this.tokenType !== 'admin') {
      throw new UazapiError('createInstance requires admin token', 400);
    }
    return this.request<UazapiInstanceCreateResponse>(
      'POST',
      '/instance/create',
      payload,
    );
  }

  async connect(
    payload: UazapiConnectPayload = {},
  ): Promise<UazapiConnectResponse> {
    return this.request<UazapiConnectResponse>(
      'POST',
      '/instance/connect',
      payload,
    );
  }

  async disconnect(): Promise<unknown> {
    return this.request<unknown>('POST', '/instance/disconnect');
  }

  async status(): Promise<UazapiStatusResponse> {
    return this.request<UazapiStatusResponse>('GET', '/instance/status');
  }

  async sendText(
    payload: UazapiSendTextPayload,
  ): Promise<UazapiSendTextResponse> {
    return this.request<UazapiSendTextResponse>('POST', '/send/text', payload);
  }

  async setWebhook(payload: UazapiWebhookPayload): Promise<unknown> {
    return this.request<unknown>('POST', '/webhook', {
      ...payload,
      excludeMessages: payload.excludeMessages ?? ['wasSentByApi'],
    });
  }
}

export function getAdminClient(): UazapiClient {
  const baseUrl = process.env.UAZAPI_BASE_URL;
  const adminToken = process.env.UAZAPI_ADMIN_TOKEN;

  if (!baseUrl) {
    throw new Error('UAZAPI_BASE_URL not configured in .env');
  }
  if (!adminToken) {
    throw new Error('UAZAPI_ADMIN_TOKEN not configured in .env');
  }

  return new UazapiClient(baseUrl, adminToken, 'admin');
}

export function getInstanceClient(token: string): UazapiClient {
  const baseUrl = process.env.UAZAPI_BASE_URL;
  if (!baseUrl) {
    throw new Error('UAZAPI_BASE_URL not configured in .env');
  }
  return new UazapiClient(baseUrl, token, 'instance');
}
