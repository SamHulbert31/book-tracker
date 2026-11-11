import { useEffect, useRef } from 'react';
import { db } from '../db/db';
import { useBooks } from '../db/hooks';
import { updateBook } from '../db/repo';
import { tagGenres } from './features';
import { currentProvider } from './useAi';

const TRIED_KEY = 'library.ai.tagged';
const BATCH = 20;

// Books the AI has already been asked about, so a book it cannot place is not asked again on every change.
const readTried = (): Set<string> => {
  try {
    return new Set(JSON.parse(localStorage.getItem(TRIED_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
};
const writeTried = (ids: Set<string>) => {
  try {
    localStorage.setItem(TRIED_KEY, JSON.stringify([...ids]));
  } catch {
    // Storage blocked: the worst case is asking again next visit.
  }
};

/**
 * Tags books that have no genres (added by hand, or imported) using the AI, when a key is set.
 * Silent: one try per book, and any error (quota, no connection) ends the work until the app reopens.
 */
export function useAutoTagGenres() {
  const books = useBooks();
  const running = useRef(false);
  const stopped = useRef(false);

  useEffect(() => {
    if (!books || stopped.current) return;
    const provider = currentProvider();
    if (!provider) return;
    const tried = readTried();
    const todo = books.filter((b) => b.genres.length === 0 && b.title.trim() && !tried.has(b.id));
    if (todo.length === 0) return;

    // Wait a moment so a burst of changes (an import) is tagged in one go.
    const timer = window.setTimeout(async () => {
      if (running.current || stopped.current) return;
      running.current = true;
      try {
        for (let i = 0; i < todo.length; i += BATCH) {
          const batch = todo.slice(i, i + BATCH);
          const tags = await tagGenres(provider, batch);
          for (const book of batch) {
            const genres = tags.get(book.id);
            // Do not overwrite genres the user filled in while this was running.
            const fresh = await db.books.get(book.id);
            if (genres && fresh && !fresh.deletedAt && fresh.genres.length === 0) await updateBook(book.id, { genres });
            tried.add(book.id);
          }
          writeTried(tried);
        }
      } catch {
        stopped.current = true;
      } finally {
        running.current = false;
      }
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [books]);
}
