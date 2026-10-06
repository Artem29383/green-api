import type {
  CheckAccountResponse,
  GreenApiCredentials,
  GreenApiNotification,
  SendMessageResponse,
  StateInstanceResponse,
} from './greenApi.types';

export interface GreenApiClient {
  getStateInstance(signal?: AbortSignal): Promise<StateInstanceResponse>;
  checkAccount(
    phoneNumber: string,
    signal?: AbortSignal,
  ): Promise<CheckAccountResponse>;
  sendMessage(
    chatId: string,
    message: string,
    signal?: AbortSignal,
  ): Promise<SendMessageResponse>;
  receiveNotification(
    signal?: AbortSignal,
  ): Promise<GreenApiNotification | null>;
  deleteNotification(receiptId: number, signal?: AbortSignal): Promise<void>;
}

type FetchLike = typeof fetch;

export class GreenApiHttpError extends Error {
  constructor(
    public readonly status: number,
    details: string,
  ) {
    super(`Ошибка GREEN-API (${status}): ${details}`);
    this.name = 'GreenApiHttpError';
  }
}

function normalizeApiUrl(apiUrl: string): string {
  return apiUrl.trim().replace(/\/+$/, '');
}

function extractErrorMessage(raw: string, fallback: string): string {
  if (!raw.trim()) return fallback;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const message = parsed.message ?? parsed.error ?? parsed.description;

    if (typeof message === 'string' && message.trim()) return message;
  } catch {
    //
  }

  return raw.trim();
}

export function createGreenApiClient(
  credentials: GreenApiCredentials,
  fetchImpl: FetchLike = fetch,
): GreenApiClient {
  const baseUrl = normalizeApiUrl(credentials.apiUrl);
  const instancePrefix = `${baseUrl}/waInstance${credentials.idInstance}`;
  const token = credentials.apiTokenInstance;

  function endpoint(method: string): string {
    return `${instancePrefix}/${method}/${token}`;
  }

  async function requestJson<T>(
    url: string,
    init: RequestInit,
    allowEmpty = false,
  ): Promise<T | null> {
    const response = await fetchImpl(url, init);
    const raw = await response.text();

    if (!response.ok) {
      const details = extractErrorMessage(
        raw,
        response.statusText || 'Неизвестная ошибка',
      );
      throw new GreenApiHttpError(response.status, details);
    }

    if (!raw.trim()) {
      if (allowEmpty) return null;
      return {} as T;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      throw new Error('Неожиданная ошибка');
    }
  }

  return {
    async getStateInstance(signal) {
      const result = await requestJson<StateInstanceResponse>(
        endpoint('getStateInstance'),
        {
          method: 'GET',
          signal,
        },
      );
      return result as StateInstanceResponse;
    },

    async checkAccount(phoneNumber, signal) {
      if (!/^\d+$/.test(phoneNumber)) {
        throw new Error('Номер телефона должен содержать только цифры.');
      }

      const result = await requestJson<CheckAccountResponse>(
        endpoint('checkAccount'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: Number(phoneNumber),
            force: true,
          }),
          signal,
        },
      );
      return result as CheckAccountResponse;
    },

    async sendMessage(chatId, message, signal) {
      const result = await requestJson<SendMessageResponse>(
        endpoint('sendMessage'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId, message }),
          signal,
        },
      );
      return result as SendMessageResponse;
    },

    async receiveNotification(signal) {
      return requestJson<GreenApiNotification>(
        `${endpoint('receiveNotification')}?receiveTimeout=20`,
        { method: 'GET', signal },
        true,
      );
    },

    async deleteNotification(receiptId, signal) {
      await requestJson<Record<string, unknown>>(
        `${endpoint('deleteNotification')}/${receiptId}`,
        { method: 'DELETE', signal },
        true,
      );
    },
  };
}
