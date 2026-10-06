import type { FormEvent, KeyboardEvent } from 'react';

interface MessageComposerProps {
  value: string;
  sending: boolean;
  error: string | null;
  onChange: (value: string) => void;
  onSend: () => void;
}

const MAX_MESSAGE_LENGTH = 4096;

export function MessageComposer({
  value,
  sending,
  error,
  onChange,
  onSend,
}: MessageComposerProps) {
  const tooLong = value.length > MAX_MESSAGE_LENGTH;
  const canSend = Boolean(value.trim()) && !tooLong && !sending;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canSend) onSend();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      if (canSend) onSend();
    }
  };

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <label className="composer-input-wrap">
        <span className="sr-only">Текст сообщения</span>
        <textarea
          aria-label="Текст сообщения"
          aria-describedby={
            value.length >= 4000 ? 'message-counter' : undefined
          }
          rows={1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Сообщение…"
          disabled={sending}
        />
        {value.length >= 4000 && (
          <span
            id="message-counter"
            className={`message-counter${tooLong ? ' message-counter-error' : ''}`}
          >
            {tooLong ? 'Максимум 4096 символов.' : `${value.length} / 4096`}
          </span>
        )}
      </label>
      <button
        className="send-button"
        type="submit"
        disabled={!canSend}
        aria-label={sending ? 'Отправляем…' : 'Отправить'}
        title="Отправить"
      >
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m21 3-7 18-4-7-7-4 18-7ZM10 14 21 3" />
        </svg>
      </button>
      {error && (
        <div className="alert alert-error composer-error" role="alert">
          {error}
        </div>
      )}
    </form>
  );
}
