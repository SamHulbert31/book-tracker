export type Status = 'tbr' | 'reading' | 'read';

interface Base {
  id: string;
  createdAt: string;
  updatedAt: string;
  /** Tombstone: a record with this set is deleted but kept so sync can spread the deletion. */
  deletedAt?: string;
}

export interface Book extends Base {
  title: string;
  author: string;
  year?: number;
  pages?: number;
  genres: string[];
  coverUrl?: string;
  status: Status;
  /** 0.5 to 5 in 0.5 steps. */
  rating?: number;
  review?: string;
  /** Dates are local calendar days, "YYYY-MM-DD". */
  startedAt?: string;
  finishedAt?: string;
  currentPage?: number;
  isbn?: string;
  openLibraryKey?: string;
}

export interface Session extends Base {
  bookId: string;
  /** Local calendar day, "YYYY-MM-DD". */
  date: string;
  startPage?: number;
  endPage?: number;
  /** 0 for a page update logged without the timer. */
  durationSec: number;
}

export interface Quote extends Base {
  bookId: string;
  text: string;
  page?: number;
  chapter?: string;
}

export interface Meta {
  key: 'main';
  schemaVersion: number;
  lastSyncAt?: string;
  /** Cached AI results, keyed by feature, with when they were generated. */
  ai?: { [feature: string]: { generatedAt: string; result: unknown; /** Fingerprint of the data the result was made from. */ dataKey?: string } };
}
