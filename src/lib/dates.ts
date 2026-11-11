const LOCALE = 'en-AU';

export const MONTH_LETTERS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** e.g. "Wednesday 11 November" */
export function longDate(now: Date): string {
  return now.toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Local calendar day as "YYYY-MM-DD". */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const todayISO = () => toISODate(new Date());

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** "2 Oct", or "2 Oct 2025" when it is not this year. */
export function formatDate(s: string | undefined): string {
  if (!s) return '–';
  const d = parseISODate(s);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(LOCALE, sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Whole days from a to b. */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseISODate(b).getTime() - parseISODate(a).getTime()) / 86_400_000);
}

export function formatDays(n: number): string {
  if (n === 0) return 'Same day';
  return n === 1 ? '1 day' : `${n} days`;
}

/** "1 h 05 m", "48 m". */
export function formatDuration(totalSec: number): string {
  const totalMin = Math.round(totalSec / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h} h ${String(m).padStart(2, '0')} m` : `${m} m`;
}

export const formatNumber = (n: number) => n.toLocaleString(LOCALE);
