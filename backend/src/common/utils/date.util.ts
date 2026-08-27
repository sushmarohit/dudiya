export function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Format a local calendar date as YYYY-MM-DD (never use toISOString for this). */
export function formatDateKey(d: Date): string {
  const normalized = startOfDay(d);
  const year = normalized.getFullYear();
  const month = String(normalized.getMonth() + 1).padStart(2, '0');
  const day = String(normalized.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toDateKey(d: Date): string {
  return formatDateKey(d);
}

/** Parse YYYY-MM-DD as a local calendar date (not UTC midnight). */
export function parseDateInput(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsed = new Date(year, month - 1, day);
    if (
      parsed.getFullYear() !== year ||
      parsed.getMonth() !== month - 1 ||
      parsed.getDate() !== day
    ) {
      throw new Error('Invalid date');
    }
    return parsed;
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error('Invalid date');
  }
  return startOfDay(d);
}

export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  const d = startOfDay(date).getTime();
  return d >= startOfDay(start).getTime() && d <= startOfDay(end).getTime();
}
