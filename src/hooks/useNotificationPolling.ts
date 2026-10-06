import { useEffect, useRef } from 'react';
import type { GreenApiClient } from '../api/greenApi';
import type { ParsedIncomingMessage } from '../api/greenApi.types';
import { runNotificationPolling } from './notificationPolling';

interface UseNotificationPollingOptions {
  client: GreenApiClient | null;
  chatId: string | null;
  enabled: boolean;
  onMessage: (message: ParsedIncomingMessage) => void;
  onError: (error: Error) => void;
}

export function useNotificationPolling({
  client,
  chatId,
  enabled,
  onMessage,
  onError,
}: UseNotificationPollingOptions): void {
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!enabled || !client) return undefined;

    const controller = new AbortController();

    void runNotificationPolling({
      client,
      chatId,
      signal: controller.signal,
      onMessage: (message) => onMessageRef.current(message),
      onError: (error) => onErrorRef.current(error),
    });

    return () => controller.abort();
  }, [client, chatId, enabled]);
}
