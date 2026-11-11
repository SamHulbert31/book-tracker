import { db } from './db';
import type { Book, Quote, Session } from './types';
import { todayISO } from '../lib/dates';
import { schedulePush } from '../sync';

const now = () => new Date().toISOString();

/** Merge a patch into a record. A key present with the value `undefined` clears it; an absent key is left alone. */
function merge<T extends object>(existing: T, patch: Partial<T>): T {
  const merged = { ...existing, ...patch } as Record<string, unknown>;
  for (const key of Object.keys(merged)) {
    if (merged[key] === undefined) delete merged[key];
  }
  return merged as T;
}

// Every change below ends with schedulePush(): after about five quiet seconds the
// change is synced to the private GitHub repo (a no-op until sync is set up).

// ---- Books

export type NewBook = Pick<Book, 'title' | 'author' | 'genres' | 'status'> &
  Partial<Omit<Book, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;

export async function addBook(input: NewBook): Promise<Book> {
  const stamp = now();
  const book = merge({ ...input, id: crypto.randomUUID(), createdAt: stamp, updatedAt: stamp } as Book, {});
  await db.books.add(book);
  schedulePush();
  return book;
}

/** Adds many books at once (the Goodreads import). A book may carry its own createdAt, e.g. the Goodreads "Date Added". */
export async function addBooks(inputs: (NewBook & { createdAt?: string })[]): Promise<number> {
  const stamp = now();
  const books = inputs.map((input) =>
    merge({ ...input, id: crypto.randomUUID(), createdAt: input.createdAt ?? stamp, updatedAt: stamp } as Book, {}),
  );
  await db.books.bulkAdd(books);
  schedulePush();
  return books.length;
}

export async function updateBook(id: string, patch: Partial<Book>): Promise<void> {
  await db.transaction('rw', db.books, async () => {
    const existing = await db.books.get(id);
    if (!existing || existing.deletedAt) return;
    await db.books.put(merge(existing, { ...patch, updatedAt: now() }));
  });
  schedulePush();
}

export const startReading = (id: string) =>
  updateBook(id, { status: 'reading', startedAt: todayISO(), finishedAt: undefined, currentPage: 0 });

export const finishBook = (id: string, details: { finishedAt: string; rating?: number; review?: string }) =>
  updateBook(id, { status: 'read', ...details });

/** Rating and review are kept, so finishing the book again starts from them. */
export const moveToTbr = (id: string) =>
  updateBook(id, { status: 'tbr', startedAt: undefined, finishedAt: undefined, currentPage: undefined });

/** Tombstones the book along with its sessions and quotes. */
export async function deleteBook(id: string): Promise<void> {
  const stamp = now();
  await db.transaction('rw', db.books, db.sessions, db.quotes, async () => {
    await db.books.where('id').equals(id).modify({ deletedAt: stamp, updatedAt: stamp });
    await db.sessions.where('bookId').equals(id).modify({ deletedAt: stamp, updatedAt: stamp });
    await db.quotes.where('bookId').equals(id).modify({ deletedAt: stamp, updatedAt: stamp });
  });
  schedulePush();
}

// ---- Sessions

export type NewSession = Pick<Session, 'bookId' | 'date' | 'durationSec'> & Partial<Pick<Session, 'startPage' | 'endPage'>>;

export async function addSession(input: NewSession): Promise<Session> {
  const stamp = now();
  const session = merge({ ...input, id: crypto.randomUUID(), createdAt: stamp, updatedAt: stamp } as Session, {});
  await db.sessions.add(session);
  schedulePush();
  return session;
}

export async function updateSession(id: string, patch: Partial<Session>): Promise<void> {
  await db.transaction('rw', db.sessions, async () => {
    const existing = await db.sessions.get(id);
    if (!existing || existing.deletedAt) return;
    await db.sessions.put(merge(existing, { ...patch, updatedAt: now() }));
  });
  schedulePush();
}

export async function deleteSession(id: string): Promise<void> {
  const stamp = now();
  await db.sessions.update(id, { deletedAt: stamp, updatedAt: stamp });
  schedulePush();
}

/**
 * Records a new current page. Moving forward logs a session without a timer
 * (which also counts toward the streak); moving back is treated as a correction.
 */
export async function logPages(book: Book, page: number): Promise<void> {
  const previous = book.currentPage ?? 0;
  await db.transaction('rw', db.books, db.sessions, async () => {
    if (page > previous) {
      await addSession({ bookId: book.id, date: todayISO(), startPage: previous, endPage: page, durationSec: 0 });
    }
    await updateBook(book.id, { currentPage: page });
  });
}

// ---- Quotes

export type NewQuote = Pick<Quote, 'bookId' | 'text'> & Partial<Pick<Quote, 'page' | 'chapter'>>;

export async function addQuote(input: NewQuote): Promise<Quote> {
  const stamp = now();
  const quote = merge({ ...input, id: crypto.randomUUID(), createdAt: stamp, updatedAt: stamp } as Quote, {});
  await db.quotes.add(quote);
  schedulePush();
  return quote;
}

export async function updateQuote(id: string, patch: Partial<Quote>): Promise<void> {
  await db.transaction('rw', db.quotes, async () => {
    const existing = await db.quotes.get(id);
    if (!existing || existing.deletedAt) return;
    await db.quotes.put(merge(existing, { ...patch, updatedAt: now() }));
  });
  schedulePush();
}

export async function deleteQuote(id: string): Promise<void> {
  const stamp = now();
  await db.quotes.update(id, { deletedAt: stamp, updatedAt: stamp });
  schedulePush();
}
