import type { Book, Session } from '../db/types';
import { daysBetween, toISODate } from './dates';

/** A calendar month (0 to 11), a whole year, or everything. */
export type Period = { kind: 'month'; year: number; month: number } | { kind: 'year'; year: number } | { kind: 'all' };

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTH_NAMES_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const yearOf = (date: string) => Number(date.slice(0, 4));
const monthOf = (date: string) => Number(date.slice(5, 7)) - 1;

/** Whether a "YYYY-MM-DD" date falls inside the period. */
export function inPeriod(date: string | undefined, period: Period): boolean {
  if (!date) return false;
  if (period.kind === 'all') return true;
  if (yearOf(date) !== period.year) return false;
  return period.kind === 'year' || monthOf(date) === period.month;
}

/** Books marked read with a finish date inside the period. */
export function finishedIn(books: Book[], period: Period): Book[] {
  return books.filter((b) => b.status === 'read' && inPeriod(b.finishedAt, period));
}

/** Pages covered by a session. A page update logged without a timer is a session too. */
export function sessionPages(s: Session): number {
  if (s.startPage === undefined || s.endPage === undefined) return 0;
  return Math.max(0, s.endPage - s.startPage);
}

export interface PageEvent {
  date: string;
  pages: number;
}

/**
 * Where pages come from: the page count of each finished book on the day it was
 * finished, plus the page ranges of sessions for books still in progress. Sessions
 * of finished books are left out so nothing is counted twice.
 */
export function pageEvents(books: Book[], sessions: Session[]): PageEvent[] {
  const events: PageEvent[] = [];
  const byId = new Map(books.map((b) => [b.id, b]));
  for (const book of books) {
    if (book.status === 'read' && book.finishedAt && book.pages) events.push({ date: book.finishedAt, pages: book.pages });
  }
  for (const s of sessions) {
    const book = byId.get(s.bookId);
    if (book && book.status !== 'read') events.push({ date: s.date, pages: sessionPages(s) });
  }
  return events;
}

export const pagesIn = (events: PageEvent[], period: Period) =>
  events.filter((e) => inPeriod(e.date, period)).reduce((sum, e) => sum + e.pages, 0);

export function averageRating(books: Book[]): number | undefined {
  const rated = books.filter((b) => b.rating !== undefined);
  if (rated.length === 0) return undefined;
  return rated.reduce((sum, b) => sum + (b.rating ?? 0), 0) / rated.length;
}

/** Mean days from start to finish, over books that have both dates. */
export function averageDays(books: Book[]): number | undefined {
  const timed = books.filter((b) => b.startedAt && b.finishedAt);
  if (timed.length === 0) return undefined;
  return timed.reduce((sum, b) => sum + daysBetween(b.startedAt!, b.finishedAt!), 0) / timed.length;
}

/** Books finished in each month of a year. */
export function booksByMonth(books: Book[], year: number): number[] {
  const counts = new Array<number>(12).fill(0);
  for (const b of finishedIn(books, { kind: 'year', year })) counts[monthOf(b.finishedAt!)]++;
  return counts;
}

/** Pages in each month of a year. */
export function pagesByMonth(events: PageEvent[], year: number): number[] {
  const pages = new Array<number>(12).fill(0);
  for (const e of events) if (yearOf(e.date) === year) pages[monthOf(e.date)] += e.pages;
  return pages;
}

/** Pages on each day of a month. */
export function pagesByDay(events: PageEvent[], year: number, month: number): number[] {
  const days = new Date(year, month + 1, 0).getDate();
  const pages = new Array<number>(days).fill(0);
  for (const e of events) if (yearOf(e.date) === year && monthOf(e.date) === month) pages[Number(e.date.slice(8, 10)) - 1] += e.pages;
  return pages;
}

/** Pages per year, oldest first, from the first year with any pages up to this year. */
export function pagesByYear(events: PageEvent[], thisYear: number): { years: number[]; pages: number[] } {
  const withPages = events.filter((e) => e.pages > 0).map((e) => yearOf(e.date));
  const first = Math.max(Math.min(...withPages, thisYear), thisYear - 11);
  const years: number[] = [];
  for (let y = first; y <= thisYear; y++) years.push(y);
  return { years, pages: years.map((y) => pagesIn(events, { kind: 'year', year: y })) };
}

export interface GenreCount {
  name: string;
  count: number;
}

/** Top five genres plus Other. A book counts once for each genre it has; untagged books count as Other. */
export function genreCounts(books: Book[]): GenreCount[] {
  const tally = new Map<string, number>();
  for (const b of books) {
    const genres = b.genres.length > 0 ? b.genres : ['Other'];
    for (const g of genres) tally.set(g, (tally.get(g) ?? 0) + 1);
  }
  const named = [...tally.entries()].filter(([name]) => name !== 'Other').sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const top = named.slice(0, 5).map(([name, count]) => ({ name, count }));
  const other = (tally.get('Other') ?? 0) + named.slice(5).reduce((sum, [, count]) => sum + count, 0);
  return other > 0 ? [...top, { name: 'Other', count: other }] : top;
}

/** Counts for ratings 0.5, 1, 1.5 ... 5. */
export function ratingDistribution(books: Book[]): number[] {
  const buckets = new Array<number>(10).fill(0);
  for (const b of books) if (b.rating !== undefined) buckets[Math.round(b.rating * 2) - 1]++;
  return buckets;
}

export function longestAndShortest(books: Book[]): { longest: Book; shortest: Book } | undefined {
  const withPages = books.filter((b) => b.pages);
  if (withPages.length === 0) return undefined;
  const sorted = [...withPages].sort((a, b) => b.pages! - a.pages!);
  return { longest: sorted[0], shortest: sorted[sorted.length - 1] };
}

export function topAuthors(books: Book[], limit = 3): { name: string; count: number }[] {
  const tally = new Map<string, number>();
  for (const b of books) if (b.author.trim()) tally.set(b.author.trim(), (tally.get(b.author.trim()) ?? 0) + 1);
  return [...tally.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function readingSeconds(sessions: Session[], period: Period): number {
  return sessions.filter((s) => inPeriod(s.date, period)).reduce((sum, s) => sum + s.durationSec, 0);
}

/**
 * Consecutive days with a session or page update, counting back from today. If
 * today has nothing yet, the run that ended yesterday still counts, so the
 * streak does not read zero first thing in the morning.
 */
export function dayStreak(sessions: Session[], today: Date): number {
  const days = new Set(sessions.map((s) => s.date));
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!days.has(toISODate(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(toISODate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Years that have any data, newest first, always including this year. */
export function yearsWithData(books: Book[], sessions: Session[], thisYear: number): number[] {
  const years = new Set<number>([thisYear]);
  for (const b of books) if (b.finishedAt) years.add(yearOf(b.finishedAt));
  for (const s of sessions) years.add(yearOf(s.date));
  return [...years].sort((a, b) => b - a);
}

export function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES_LONG[month]} ${year}`;
}

/** One decimal place, e.g. 4.1 or 4.0. */
export const oneDecimal = (n: number) => n.toFixed(1);

