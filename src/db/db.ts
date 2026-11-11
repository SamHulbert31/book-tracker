import Dexie, { type Table } from 'dexie';
import type { Book, Meta, Quote, Session } from './types';

export const SCHEMA_VERSION = 1;

class LibraryDB extends Dexie {
  books!: Table<Book, string>;
  sessions!: Table<Session, string>;
  quotes!: Table<Quote, string>;
  meta!: Table<Meta, string>;

  constructor() {
    super('library');
    this.version(1).stores({
      books: 'id, status, updatedAt',
      sessions: 'id, bookId, date, updatedAt',
      quotes: 'id, bookId, updatedAt',
      meta: 'key',
    });
  }
}

export const db = new LibraryDB();
