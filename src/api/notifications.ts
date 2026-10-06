import type {
    GreenApiNotification,
    ParsedIncomingMessage,
} from './greenApi.types';

export function parseIncomingText(
    notification: GreenApiNotification,
    activeChatId: string | null,
): ParsedIncomingMessage | null {
    const body = notification?.body;

    if (!body || body.typeWebhook !== 'incomingMessageReceived') return null;

    const chatId = body.senderData?.chatId;

    if (typeof chatId !== 'string' || !chatId) return null;

    if (activeChatId !== null && chatId !== activeChatId) return null;

    if (body.messageData?.typeMessage !== 'textMessage') return null;

    const text = body.messageData.textMessageData?.textMessage;

    if (typeof text !== 'string') return null;

    const id = body.idMessage;
    const timestamp = body.timestamp;

    if (typeof id !== 'string' || typeof timestamp !== 'number') return null;

    return {
        chatId,
        id,
        text,
        timestamp: timestamp * 1000,
        direction: 'incoming',
    };
}
