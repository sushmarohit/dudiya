import { formatDateKey, parseDateInput } from './date.util';

describe('date.util', () => {
  it('parses YYYY-MM-DD as local calendar date', () => {
    const d = parseDateInput('2026-06-19');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5);
    expect(d.getDate()).toBe(19);
  });

  it('formats local calendar date without UTC shift', () => {
    const d = new Date(2026, 5, 19);
    expect(formatDateKey(d)).toBe('2026-06-19');
  });
});
