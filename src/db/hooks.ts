import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';

/** All hooks return `undefined` while the first read is in flight. */

export function useBooks() {
  return useLiveQuery(() => db.books.filter((b) => !b.deletedAt).toArray(), []);
}

export function useSessions() {
  return useLiveQuery(() => db.sessions.filter((s) => !s.deletedAt).toArray(), []);
}

/** `null` means the book does not exist (or was deleted). */
export function useBook(id: string | undefined) {
  return useLiveQuery(async () => {
    const book = id ? await db.books.get(id) : undefined;
    return book && !book.deletedAt ? book : null;
  }, [id]);
}
