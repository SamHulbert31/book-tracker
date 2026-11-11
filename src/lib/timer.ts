/**
 * The reading timer lives in localStorage as timestamps, not as a counter, so it
 * keeps the right time when the phone locks, the tab is suspended or the app is
 * reloaded. Elapsed time is always worked out from `Date.now()`.
 */
const KEY = 'library.timer';

export interface TimerState {
  bookId: string;
  /** The day the session started, "YYYY-MM-DD". */
  date: string;
  /** Time banked from earlier run segments (before a pause). */
  accumulatedMs: number;
  /** When the current run segment began. Absent while paused or stopped. */
  startedAtMs?: number;
  /** Stopped means the clock is final and the page range is being entered. */
  stopped: boolean;
}

export function readTimer(): TimerState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TimerState;
    return typeof parsed.bookId === 'string' && typeof parsed.accumulatedMs === 'number' ? parsed : null;
  } catch {
    return null;
  }
}

export function writeTimer(timer: TimerState | null): void {
  try {
    if (timer) localStorage.setItem(KEY, JSON.stringify(timer));
    else localStorage.removeItem(KEY);
  } catch {
    // Storage can be blocked (private windows); the timer then lasts until the page closes.
  }
}

export const elapsedMs = (timer: TimerState, at = Date.now()): number =>
  timer.accumulatedMs + (timer.startedAtMs !== undefined ? Math.max(0, at - timer.startedAtMs) : 0);

/** "0:04:23" or "1:05:00". */
export function formatClock(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
