import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../api/greenApi.types';

interface MessageListProps {
  messages: ChatMessage[];
}

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function MessageList({ messages }: MessageListProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const target = endRef.current;
    if (target && typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ block: 'end', behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div
      className="message-list"
      aria-live="polite"
      aria-label="История сообщений"
    >
      {messages.length === 0 ? (
        <div className="empty-chat">
          <strong>Чат создан</strong>
          <span>Напишите первое текстовое сообщение.</span>
        </div>
      ) : (
        messages.map((message) => (
          <article
            className={`message-row message-row-${message.direction}`}
            key={`${message.direction}-${message.id}`}
          >
            <div
              className={`message-bubble message-bubble-${message.direction}`}
            >
              <p>{message.text}</p>
              <time dateTime={new Date(message.timestamp).toISOString()}>
                {formatTime(message.timestamp)}
              </time>
            </div>
          </article>
        ))
      )}
      <div ref={endRef} />
    </div>
  );
}
