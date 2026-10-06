/** Удаляет всё, кроме цифр, чтобы получить номер в международном формате. */
export function normalizePhone(value: string): string {
  return value.replace(/\D/g, '');
}
