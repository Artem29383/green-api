import { describe, expect, it } from 'vitest';

describe('normalizePhone', () => {
  it('оставляет в номере только цифры', async () => {
    const module = await import('./phone').catch(
      () => ({}) as Record<string, unknown>,
    );
    const normalizePhone = (
      module as { normalizePhone?: (value: string) => string }
    ).normalizePhone;

    expect(normalizePhone).toBeTypeOf('function');
    expect(normalizePhone?.('+7 (999) 123-45-67')).toBe('79991234567');
  });

  it('возвращает пустую строку для пустого значения', async () => {
    const module = await import('./phone').catch(
      () => ({}) as Record<string, unknown>,
    );
    const normalizePhone = (
      module as { normalizePhone?: (value: string) => string }
    ).normalizePhone;

    expect(normalizePhone).toBeTypeOf('function');
    expect(normalizePhone?.('')).toBe('');
  });
});
