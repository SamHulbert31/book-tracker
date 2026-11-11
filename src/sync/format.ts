import type { Book, Quote, Session } from '../db/types';

// The one JSON file kept in the private repo, and the shape of an export.
export const SYNC_FORMAT = 1;

export interface Snapshot {
  books: Book[];
  sessions: Session[];
  quotes: Quote[];
}

export interface SyncFile extends Snapshot {
  app: 'library';
  format: typeof SYNC_FORMAT;
  savedAt: string;
}

const byId = <T extends { id: string }>(a: T, b: T) => a.id.localeCompare(b.id);

// Records sorted by id, so the same data always serialises to the same text and a no-op sync never commits.
export function toSyncFile(s: Snapshot, savedAt: string): SyncFile {
  return {
    app: 'library',
    format: SYNC_FORMAT,
    savedAt,
    books: [...s.books].sort(byId),
    sessions: [...s.sessions].sort(byId),
    quotes: [...s.quotes].sort(byId),
  };
}

export const serialize = (file: SyncFile) => JSON.stringify(file, null, 2) + '\n';

// What matters when deciding whether the remote file needs rewriting: everything but the timestamp.
export const contentKey = (file: SyncFile) => serialize({ ...file, savedAt: '' });

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isIso = (x: unknown) => typeof x === 'string' && !Number.isNaN(Date.parse(x));

function baseOk(r: unknown): r is Record<string, unknown> & { id: string; createdAt: string; updatedAt: string } {
  return isRecord(r) && typeof r.id === 'string' && r.id.length > 0 && isIso(r.createdAt) && isIso(r.updatedAt) && (r.deletedAt === undefined || isIso(r.deletedAt));
}

const bookOk = (r: unknown): r is Book =>
  baseOk(r) &&
  typeof r.title === 'string' &&
  typeof r.author === 'string' &&
  Array.isArray(r.genres) &&
  ['tbr', 'reading', 'read'].includes(r.status as string);

const sessionOk = (r: unknown): r is Session =>
  baseOk(r) && typeof r.bookId === 'string' && typeof r.date === 'string' && typeof r.durationSec === 'number';

const quoteOk = (r: unknown): r is Quote => baseOk(r) && typeof r.bookId === 'string' && typeof r.text === 'string';

// Parses text from the repo or an import. Throws with a plain sentence when it is not Library data,
// so a stray file is never merged in or written over.
export function parseSyncFile(text: string): SyncFile {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('The file is not valid JSON.');
  }
  if (!isRecord(data) || data.app !== 'library' || !Array.isArray(data.books) || !Array.isArray(data.sessions) || !Array.isArray(data.quotes)) {
    throw new Error('The file is not Library data.');
  }
  if (data.format !== SYNC_FORMAT) {
    throw new Error(`The file uses data format ${String(data.format)}, which this version of the app does not know.`);
  }
  const badBook = data.books.findIndex((b) => !bookOk(b));
  if (badBook >= 0) throw new Error(`Book ${badBook + 1} in the file is not valid.`);
  const badSession = data.sessions.findIndex((s) => !sessionOk(s));
  if (badSession >= 0) throw new Error(`Session ${badSession + 1} in the file is not valid.`);
  const badQuote = data.quotes.findIndex((q) => !quoteOk(q));
  if (badQuote >= 0) throw new Error(`Quote ${badQuote + 1} in the file is not valid.`);
  return {
    app: 'library',
    format: SYNC_FORMAT,
    savedAt: isIso(data.savedAt) ? (data.savedAt as string) : '',
    books: data.books as Book[],
    sessions: data.sessions as Session[],
    quotes: data.quotes as Quote[],
  };
}
