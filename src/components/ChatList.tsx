import type { Chat } from '../types';

interface ChatListProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelect: (chatId: string) => void;
}

export function ChatList({ chats, activeChatId, onSelect }: ChatListProps) {
  return (
    <nav className="chat-list" aria-label="Список чатов">
      {chats.length === 0 && (
        <p className="sidebar-empty">Здесь появятся ваши чаты</p>
      )}
      {chats.map((chat) => {
        const lastMessage = chat.messages.at(-1);
        return (
          <button
            className={`chat-item${activeChatId === chat.chatId ? ' chat-item-active' : ''}`}
            type="button"
            aria-label={`Открыть чат ${chat.phone}`}
            aria-current={activeChatId === chat.chatId ? 'true' : undefined}
            onClick={() => onSelect(chat.chatId)}
            key={chat.chatId}
          >
            <span className="avatar" aria-hidden="true">
              {chat.phone.replace(/\D/g, '').slice(-2) || 'TG'}
            </span>
            <span className="chat-item-text">
              <span className="chat-item-title">{chat.phone}</span>
              <span className="chat-item-preview">
                {lastMessage?.text || 'Нет сообщений'}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
