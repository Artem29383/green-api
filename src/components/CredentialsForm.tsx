import type { FormEvent } from 'react';
import type { GreenApiCredentials } from '../api/greenApi.types';

interface CredentialsFormProps {
  values: GreenApiCredentials;
  loading: boolean;
  error: string | null;
  onChange: (field: keyof GreenApiCredentials, value: string) => void;
  onSubmit: () => void;
}

export function CredentialsForm({
  values,
  loading,
  error,
  onChange,
  onSubmit,
}: CredentialsFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <main className="connection-screen">
      <section className="connection-card" aria-labelledby="connection-title">
        <h1 id="connection-title">Telegram-чат</h1>
        <p className="muted connection-description">
          Введите данные инстанса из кабинета GREEN-API.
        </p>

        <form className="form-stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>
              ID инстанса
            </span>
            <input
              name="idInstance"
              inputMode="numeric"
              autoComplete="off"
              value={values.idInstance}
              onChange={(event) => onChange('idInstance', event.target.value)}
              placeholder="410000001"
              disabled={loading}
            />
          </label>

          <label className="field">
            <span>
              API-токен
            </span>
            <input
              name="apiTokenInstance"
              type="password"
              autoComplete="off"
              value={values.apiTokenInstance}
              onChange={(event) =>
                onChange('apiTokenInstance', event.target.value)
              }
              placeholder="Введите токен"
              disabled={loading}
            />
          </label>

          <label className="field">
            <span>
              API URL
            </span>
            <input
              name="apiUrl"
              type="url"
              autoComplete="off"
              value={values.apiUrl}
              onChange={(event) => onChange('apiUrl', event.target.value)}
              placeholder="https://api.green-api.com"
              disabled={loading}
            />
          </label>

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'загрузка…' : 'Подключиться'}
          </button>
        </form>
      </section>
    </main>
  );
}
