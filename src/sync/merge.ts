import type { Book, Quote, Session } from '../db/types';
import type { Snapshot } from './format';

interface Rec {
  id: string;
  updatedAt: string;
  deletedAt?: string;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// Per record by id: newest updatedAt wins; on a tie a tombstone beats a live record, and
// otherwise the local copy stands. Returns the winners plus what each side is missing.
export function mergeRecords<T extends Rec>(local: T[], remote: T[]): { merged: T[]; toLocal: T[]; toRemote: T[] } {
  const l = new Map(local.map((r) => [r.id, r]));
  const r = new Map(remote.map((x) => [x.id, x]));
  const merged: T[] = [];
  const toLocal: T[] = [];
  const toRemote: T[] = [];

  for (const id of new Set([...l.keys(), ...r.keys()])) {
    const a = l.get(id);
    const b = r.get(id);
    let winner: T;
    if (a && b) {
      if (a.updatedAt !== b.updatedAt) winner = a.updatedAt > b.updatedAt ? a : b;
      else if (!!a.deletedAt !== !!b.deletedAt) winner = a.deletedAt ? a : b;
      else winner = a;
    } else {
      winner = (a ?? b) as T;
    }
    merged.push(winner);
    if (!a || !same(a, winner)) toLocal.push(winner);
    if (!b || !same(b, winner)) toRemote.push(winner);
  }
  return { merged, toLocal, toRemote };
}

export interface MergeResult {
  merged: Snapshot;
  /** Records the device must write. Empty when nothing new came in. */
  toLocal: { books: Book[]; sessions: Session[]; quotes: Quote[] };
  /** True when the remote file does not already hold exactly the merged data. */
  remoteChanged: boolean;
}

export function mergeSnapshots(local: Snapshot, remote: Snapshot): MergeResult {
  const books = mergeRecords(local.books, remote.books);
  const sessions = mergeRecords(local.sessions, remote.sessions);
  const quotes = mergeRecords(local.quotes, remote.quotes);
  return {
    merged: { books: books.merged, sessions: sessions.merged, quotes: quotes.merged },
    toLocal: { books: books.toLocal, sessions: sessions.toLocal, quotes: quotes.toLocal },
    remoteChanged: books.toRemote.length > 0 || sessions.toRemote.length > 0 || quotes.toRemote.length > 0,
  };
}
