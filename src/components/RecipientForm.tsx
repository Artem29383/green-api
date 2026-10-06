import type { FormEvent } from 'react';

interface RecipientFormProps {
  value: string;
  loading: boolean;
  error: string | null;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function RecipientForm({
  value,
  loading,
  error,
  onChange,
  onSubmit,
}: RecipientFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <section
      id="recipient-panel"
      className="recipient-panel"
      aria-labelledby="new-chat-title"
    >
      <div className="recipient-copy">
        <h2 id="new-chat-title">Новый чат</h2>
        <p className="muted">Введите номер в международном формате.</p>
      </div>
      <form className="recipient-form" onSubmit={handleSubmit}>
        <label className="field recipient-field">
          <span className="sr-only">Номер телефона получателя</span>
          <input
            aria-label="Номер телефона получателя"
            type="tel"
            autoComplete="tel"
            autoFocus
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="79991234567"
            disabled={loading}
          />
        </label>
        <button className="secondary-button" type="submit" disabled={loading}>
          {loading ? 'Проверяем…' : 'Создать чат'}
        </button>
      </form>
      {error && (
        <div className="alert alert-error recipient-error" role="alert">
          {error}
        </div>
      )}
    </section>
  );
}
