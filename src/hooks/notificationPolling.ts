import { GreenApiHttpError, type GreenApiClient } from '../api/greenApi';
import type { ParsedIncomingMessage } from '../api/greenApi.types';
import { parseIncomingText } from '../api/notifications';

export interface NotificationPollingOptions {
  client: GreenApiClient;
  chatId: string | null;
  signal: AbortSignal;
  onMessage: (message: ParsedIncomingMessage) => void;
  onError: (error: Error) => void;
  retryDelayMs?: number;
}

function isAbortError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'name' in error &&
    (error as { name?: unknown }).name === 'AbortError',
  );
}

function toError(error: unknown): Error {
  return error instanceof Error
    ? error
    : new Error('Неизвестная ошибка получения сообщений.');
}

function isPermanentHttpError(error: unknown): boolean {
  const status =
    error instanceof GreenApiHttpError
      ? error.status
      : error && typeof error === 'object' && 'status' in error
        ? (error as { status?: unknown }).status
        : undefined;

  return (
    typeof status === 'number' &&
    status >= 400 &&
    status < 500 &&
    status !== 408 &&
    status !== 429
  );
}

function waitForRetry(delayMs: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.resolve();

  return new Promise((resolve) => {
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      signal.removeEventListener('abort', finish);
      resolve();
    };

    const timeoutId = setTimeout(finish, delayMs);
    signal.addEventListener('abort', finish, { once: true });
  });
}

export async function runNotificationPolling({
  client,
  chatId,
  signal,
  onMessage,
  onError,
  retryDelayMs = 1500,
}: NotificationPollingOptions): Promise<void> {
  while (!signal.aborted) {
    try {
      const notification = await client.receiveNotification(signal);
      if (signal.aborted) return;
      if (!notification) continue;

      const message = parseIncomingText(notification, chatId);
      if (message) onMessage(message);

      await client.deleteNotification(notification.receiptId, signal);
    } catch (error) {
      if (signal.aborted || isAbortError(error)) return;

      onError(toError(error));

      if (isPermanentHttpError(error)) return;
      await waitForRetry(retryDelayMs, signal);
    }
  }
}
