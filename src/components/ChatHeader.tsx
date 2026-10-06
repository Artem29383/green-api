interface ChatHeaderProps {
  onNewChat: () => void;
  creatingChat: boolean;
}

export function ChatHeader({ onNewChat, creatingChat }: ChatHeaderProps) {
  return (
    <header className="chat-header">
      <h1>Чаты</h1>
      <button
        className="icon-button new-chat-button"
        type="button"
        aria-label="Новый чат"
        aria-expanded={creatingChat}
        aria-controls="recipient-panel"
        title="Новый чат"
        onClick={onNewChat}
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
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </header>
  );
}
