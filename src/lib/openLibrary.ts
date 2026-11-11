import type { Book } from '../db/types';
import { mapSubjects } from './genres';

export interface SearchResult {
  key: string;
  title: string;
  author: string;
  year?: number;
  pages?: number;
  coverUrl?: string;
  isbn?: string;
  genres: string[];
}

export class SearchError extends Error {
  constructor(
    readonly kind: 'offline' | 'server' | 'network',
    message: string,
  ) {
    super(message);
  }
}

interface Doc {
  key?: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  number_of_pages_median?: number;
  cover_i?: number;
  subject?: string[];
  isbn?: string[];
}

const FIELDS = 'key,title,author_name,first_publish_year,number_of_pages_median,cover_i,subject,isbn';

export async function searchBooks(query: string, signal: AbortSignal): Promise<SearchResult[]> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new SearchError('offline', 'You are offline.');
  }
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&fields=${FIELDS}&limit=20`;
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new SearchError('network', 'Could not reach Open Library.');
  }
  if (!response.ok) throw new SearchError('server', `Open Library answered ${response.status}.`);
  const data = (await response.json()) as { docs?: Doc[] };
  return (data.docs ?? [])
    .filter((doc): doc is Doc & { key: string; title: string } => Boolean(doc.key && doc.title))
    .map((doc) => ({
      key: doc.key,
      title: doc.title,
      author: doc.author_name?.[0] ?? '',
      year: doc.first_publish_year,
      pages: doc.number_of_pages_median,
      coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : undefined,
      isbn: doc.isbn?.find((i) => i.length === 13) ?? doc.isbn?.[0],
      genres: mapSubjects(doc.subject),
    }));
}

export function searchErrorMessage(error: unknown): string {
  const kind = error instanceof SearchError ? error.kind : 'network';
  if (kind === 'offline') return 'You are offline, so search is unavailable. You can still add a book by hand.';
  if (kind === 'server') return 'Open Library is not responding right now. Try again in a moment, or add the book by hand.';
  return 'Could not reach Open Library. Check your connection and try again.';
}

export function resultToDraft(result: SearchResult): Partial<Book> {
  return {
    title: result.title,
    author: result.author,
    year: result.year,
    pages: result.pages,
    genres: result.genres,
    coverUrl: result.coverUrl,
    isbn: result.isbn,
    openLibraryKey: result.key,
    status: 'tbr',
  };
}
