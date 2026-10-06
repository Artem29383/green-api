import { useCallback, useState } from 'react';
import { createGreenApiClient, type GreenApiClient } from './api/greenApi';
import type {
  ChatMessage,
  GreenApiCredentials,
  ParsedIncomingMessage,
} from './api/greenApi.types';
import { ChatHeader } from './components/ChatHeader';
import { ChatList } from './components/ChatList';
import type { Chat } from './types';
import { CredentialsForm } from './components/CredentialsForm';
import { MessageComposer } from './components/MessageComposer';
import { MessageList } from './components/MessageList';
import { RecipientForm } from './components/RecipientForm';
import { useNotificationPolling } from './hooks/useNotificationPolling';
import { normalizePhone } from './utils/phone';

const DEFAULT_API_URL = 'https://api.green-api.com';
const MAX_MESSAGE_LENGTH = 4096;

const initialCredentials: GreenApiCredentials = {
  apiUrl: DEFAULT_API_URL,
  idInstance: '',
  apiTokenInstance: '',
};

export type GreenApiClientFactory = (
  credentials: GreenApiCredentials,
) => GreenApiClient;

interface AppProps {
  clientFactory?: GreenApiClientFactory;
}

function instanceStateError(state: string): string {
  switch (state) {
    case 'notAuthorized':
      return 'Инстанс не авторизован в Telegram. Завершите авторизацию в кабинете GREEN-API.';
    case 'blocked':
      return 'Инстанс заблокирован. Проверьте его состояние в кабинете GREEN-API.';
    case 'starting':
      return 'Инстанс ещё запускается. Попробуйте подключиться чуть позже.';
    default:
      return `Инстанс пока недоступен: ${state || 'неизвестное состояние'}.`;
  }
}

function appendUniqueMessage(
  messages: ChatMessage[],
  message: ChatMessage,
): ChatMessage[] {
  return messages.some(
    (item) => item.id === message.id && item.direction === message.direction,
  )
    ? messages
    : [...messages, message];
}

export default function App({
  clientFactory = createGreenApiClient,
}: AppProps) {
  const [credentials, setCredentials] =
    useState<GreenApiCredentials>(initialCredentials);
  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'checking' | 'connected'
  >('idle');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [client, setClient] = useState<GreenApiClient | null>(null);

  const [recipient, setRecipient] = useState('');
  const [recipientLoading, setRecipientLoading] = useState(false);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [creatingChat, setCreatingChat] = useState(true);
  const [showConversation, setShowConversation] = useState(false);
  const [sending, setSending] = useState(false);
  const [pollingError, setPollingError] = useState<string | null>(null);

  const connected = connectionStatus === 'connected' && Boolean(client);
  const activeChat = chats.find((chat) => chat.chatId === activeChatId) ?? null;

  const handleIncomingMessage = useCallback(
    (message: ParsedIncomingMessage) => {
      setChats((current) => {
        const existing = current.find((chat) => chat.chatId === message.chatId);
        if (!existing) {
          return [
            ...current,
            {
              chatId: message.chatId,
              phone: message.chatId,
              messages: [message],
              draft: '',
              sendError: null,
            },
          ];
        }
        return current.map((chat) =>
          chat.chatId === message.chatId
            ? { ...chat, messages: appendUniqueMessage(chat.messages, message) }
            : chat,
        );
      });
      setPollingError(null);
    },
    [],
  );

  const handlePollingError = useCallback((error: Error) => {
    setPollingError(`Не удалось получить сообщения: ${error.message}`);
  }, []);

  useNotificationPolling({
    client,
    chatId: null,
    enabled: connected && chats.length > 0,
    onMessage: handleIncomingMessage,
    onError: handlePollingError,
  });

  const selectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setShowConversation(true);
    setCreatingChat(false);
  };

  const updateChat = (chatId: string, update: (chat: Chat) => Chat) => {
    setChats((current) =>
      current.map((chat) => (chat.chatId === chatId ? update(chat) : chat)),
    );
  };

  const updateCredential = (
    field: keyof GreenApiCredentials,
    value: string,
  ) => {
    setCredentials((current) => ({ ...current, [field]: value }));
    setConnectionError(null);
  };

  const connect = async () => {
    const idInstance = credentials.idInstance.trim();
    const apiTokenInstance = credentials.apiTokenInstance.trim();
    const apiUrl = credentials.apiUrl.trim();

    if (!idInstance || !apiTokenInstance) {
      setConnectionError('Заполните ID инстанса и API-токен.');
      return;
    }

    if (!apiUrl) {
      setConnectionError('Укажите API URL из кабинета GREEN-API.');
      return;
    }

    if (!/^\d+$/.test(idInstance)) {
      setConnectionError('ID инстанса должен содержать только цифры.');
      return;
    }

    try {
      new URL(apiUrl);
    } catch {
      setConnectionError('Укажите корректный API URL.');
      return;
    }

    setConnectionStatus('checking');
    setConnectionError(null);

    try {
      const nextCredentials = { apiUrl, idInstance, apiTokenInstance };
      const nextClient = clientFactory(nextCredentials);
      const state = await nextClient.getStateInstance();

      if (state.stateInstance !== 'authorized') {
        setConnectionStatus('idle');
        setConnectionError(instanceStateError(state.stateInstance));
        return;
      }

      setCredentials(nextCredentials);
      setClient(nextClient);
      setConnectionStatus('connected');
    } catch (error) {
      setConnectionStatus('idle');
      setClient(null);
      setConnectionError(
        error instanceof Error
          ? error.message
          : 'Не удалось подключиться к GREEN-API.',
      );
    }
  };

  const disconnect = () => {
    setClient(null);
    setConnectionStatus('idle');
    setCredentials(initialCredentials);
    setConnectionError(null);
    setRecipient('');
    setRecipientError(null);
    setActiveChatId(null);
    setChats([]);
    setCreatingChat(true);
    setShowConversation(false);
    setPollingError(null);
  };

  const createChat = async () => {
    if (!client) return;

    const normalizedPhone = normalizePhone(recipient);
    if (!normalizedPhone) {
      setRecipientError('Введите номер телефона получателя.');
      return;
    }

    setRecipientLoading(true);
    setRecipientError(null);

    try {
      const account = await client.checkAccount(normalizedPhone);
      if (!account.exist || !account.chatId) {
        setRecipientError('Аккаунт Telegram не найден.');
        return;
      }

      setChats((current) =>
        current.some((chat) => chat.chatId === account.chatId)
          ? current
          : [
              ...current,
              {
                chatId: account.chatId,
                phone: recipient.trim(),
                messages: [],
                draft: '',
                sendError: null,
              },
            ],
      );
      selectChat(account.chatId);
      setRecipient('');
    } catch (error) {
      setRecipientError(
        error instanceof Error
          ? error.message
          : 'Не удалось проверить Telegram-аккаунт.',
      );
    } finally {
      setRecipientLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!client || !activeChat || sending) return;
    const { chatId, draft } = activeChat;
    if (!draft.trim()) return;

    if (draft.length > MAX_MESSAGE_LENGTH) {
      updateChat(chatId, (chat) => ({
        ...chat,
        sendError: 'Сообщение не должно быть длиннее 4096 символов.',
      }));
      return;
    }

    const text = draft;
    setSending(true);
    updateChat(chatId, (chat) => ({ ...chat, sendError: null }));

    try {
      const result = await client.sendMessage(chatId, text);
      const outgoing: ChatMessage = {
        id: result.idMessage || `local-${Date.now()}`,
        text,
        timestamp: Date.now(),
        direction: 'outgoing',
      };
      updateChat(chatId, (chat) => ({
        ...chat,
        messages: appendUniqueMessage(chat.messages, outgoing),
        draft: '',
      }));
    } catch (error) {
      updateChat(chatId, (chat) => ({
        ...chat,
        sendError:
          error instanceof Error
            ? error.message
            : 'Не удалось отправить сообщение.',
      }));
    } finally {
      setSending(false);
    }
  };

  if (!connected) {
    return (
      <CredentialsForm
        values={credentials}
        loading={connectionStatus === 'checking'}
        error={connectionError}
        onChange={updateCredential}
        onSubmit={() => void connect()}
      />
    );
  }

  return (
    <main className="chat-screen">
      <section
        className={`chat-shell${showConversation && activeChat ? ' chat-shell-conversation' : ''}`}
        aria-label="Telegram-чат через GREEN-API"
      >
        <aside className="sidebar" aria-label="Чаты">
          <ChatHeader
            creatingChat={creatingChat}
            onNewChat={() => {
              setCreatingChat((current) => !current);
              setRecipientError(null);
            }}
          />
          {creatingChat && (
            <RecipientForm
              value={recipient}
              loading={recipientLoading}
              error={recipientError}
              onChange={(value) => {
                setRecipient(value);
                setRecipientError(null);
              }}
              onSubmit={() => void createChat()}
            />
          )}
          <ChatList
            chats={chats}
            activeChatId={activeChatId}
            onSelect={selectChat}
          />
          <footer className="sidebar-footer">
            <span className="connection-status">
              <span className="status-dot" aria-hidden="true" />
              Подключено к Telegram
            </span>
            <button className="text-button" type="button" onClick={disconnect}>
              Отключиться
            </button>
          </footer>
        </aside>

        {activeChat ? (
          <section
            className="conversation"
            aria-labelledby="conversation-title"
          >
            <header className="conversation-header">
              <button
                className="icon-button back-button"
                type="button"
                aria-label="Назад к чатам"
                onClick={() => setShowConversation(false)}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="m14 6-6 6 6 6" />
                </svg>
              </button>
              <span className="avatar" aria-hidden="true">
                {activeChat.phone.replace(/\D/g, '').slice(-2) || 'TG'}
              </span>
              <div>
                <h2 id="conversation-title">{activeChat.phone}</h2>
                <span className="muted">Telegram</span>
              </div>
            </header>
            {pollingError && (
              <div className="polling-warning" role="status">
                {pollingError}
              </div>
            )}
            <MessageList
              key={activeChat.chatId}
              messages={activeChat.messages}
            />
            <MessageComposer
              value={activeChat.draft}
              sending={sending}
              error={activeChat.sendError}
              onChange={(value) =>
                updateChat(activeChat.chatId, (chat) => ({
                  ...chat,
                  draft: value,
                  sendError: null,
                }))
              }
              onSend={() => void sendMessage()}
            />
          </section>
        ) : (
          <section className="chat-placeholder">
            <h2>Выберите чат</h2>
            <p>Или создайте новый по номеру телефона.</p>
          </section>
        )}
      </section>
    </main>
  );
}
