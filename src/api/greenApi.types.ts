export interface GreenApiCredentials {
  apiUrl: string;
  idInstance: string;
  apiTokenInstance: string;
}

export interface StateInstanceResponse {
  stateInstance: string;
}

export interface CheckAccountResponse {
  exist: boolean;
  chatId: string;
  username?: string;
  phoneNumber?: number;
  fromCache?: boolean;
}

export interface SendMessageResponse {
  idMessage: string;
}

export type MessageDirection = 'incoming' | 'outgoing';

export interface ChatMessage {
  id: string;
  text: string;
  timestamp: number;
  direction: MessageDirection;
}

export interface NotificationSenderData {
  chatId?: string;
  chatName?: string;
  sender?: string;
  senderName?: string;
  senderPhoneNumber?: number;
}

export interface NotificationMessageData {
  typeMessage?: string;
  textMessageData?: {
    textMessage?: string;
  };
}

export interface GreenApiNotificationBody {
  typeWebhook?: string;
  timestamp?: number;
  idMessage?: string;
  senderData?: NotificationSenderData;
  messageData?: NotificationMessageData;
  [key: string]: unknown;
}

export interface GreenApiNotification {
  receiptId: number;
  body: GreenApiNotificationBody;
}

export interface ParsedIncomingMessage extends ChatMessage {
  chatId: string;
  direction: 'incoming';
}
