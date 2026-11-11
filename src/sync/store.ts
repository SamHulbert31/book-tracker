import { db, SCHEMA_VERSION } from '../db/db';
import type { SyncStore } from './engine';

// The engine's view of the device database.
export const dexieStore: SyncStore = {
  async snapshot() {
    const [books, sessions, quotes] = await Promise.all([db.books.toArray(), db.sessions.toArray(), db.quotes.toArray()]);
    return { books, sessions, quotes };
  },

  // Incoming records replace local ones wholesale (the merge already decided they are newer).
  apply(changes) {
    return db.transaction('rw', db.books, db.sessions, db.quotes, async () => {
      if (changes.books.length) await db.books.bulkPut(changes.books);
      if (changes.sessions.length) await db.sessions.bulkPut(changes.sessions);
      if (changes.quotes.length) await db.quotes.bulkPut(changes.quotes);
    });
  },

  // The meta record is device only and never synced, so recording a sync never causes another one.
  async setLastSync(iso) {
    await db.transaction('rw', db.meta, async () => {
      const current = await db.meta.get('main');
      await db.meta.put({ ...(current ?? { key: 'main', schemaVersion: SCHEMA_VERSION }), lastSyncAt: iso });
    });
  },
};
