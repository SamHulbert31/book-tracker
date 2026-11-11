const LOCALE = 'en-AU';

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

export const MONTH_LETTERS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
