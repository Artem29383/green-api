import type { ChatMessage } from './api/greenApi.types';

export interface Chat {
  chatId: string;
  phone: string;
  messages: ChatMessage[];
  draft: string;
  sendError: string | null;
}
