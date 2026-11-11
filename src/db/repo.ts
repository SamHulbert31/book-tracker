import { db } from './db';
import type { Book } from './types';
import { todayISO } from '../lib/dates';

const now = () => new Date().toISOString();

/** Merge a patch into a record. A key present with the value `undefined` clears it; an absent key is left alone. */
function merge<T extends object>(existing: T, patch: Partial<T>): T {
  const merged = { ...existing, ...patch } as Record<string, unknown>;
  for (const key of Object.keys(merged)) {
    if (merged[key] === undefined) delete merged[key];
  }
  return merged as T;
}

export type NewBook = Pick<Book, 'title' | 'author' | 'genres' | 'status'> &
  Partial<Omit<Book, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;

export async function addBook(input: NewBook): Promise<Book> {
  const stamp = now();
  const book = merge(
    { ...input, id: crypto.randomUUID(), createdAt: stamp, updatedAt: stamp } as Book,
    {},
  );
  await db.books.add(book);
  return book;
}

export async function updateBook(id: string, patch: Partial<Book>): Promise<void> {
  await db.transaction('rw', db.books, async () => {
    const existing = await db.books.get(id);
    if (!existing || existing.deletedAt) return;
    await db.books.put(merge(existing, { ...patch, updatedAt: now() }));
  });
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
}
