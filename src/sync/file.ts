import { parseSyncFile, serialize, toSyncFile } from './format';
import { mergeSnapshots } from './merge';
import { schedulePush } from './index';
import { dexieStore } from './store';

// Export: the same JSON the repo holds, as a download.
export async function exportJson() {
  const snapshot = await dexieStore.snapshot();
  const text = serialize(toSyncFile(snapshot, new Date().toISOString()));
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `library-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface ImportResult {
  books: number;
  sessions: number;
  quotes: number;
}

// Import: merged in with the same rules as sync, so nothing newer on this device is lost.
// Throws with a plain reason when the file is not Library data.
export async function importJson(text: string): Promise<ImportResult> {
  const file = parseSyncFile(text);
  const local = await dexieStore.snapshot();
  const result = mergeSnapshots(local, { books: file.books, sessions: file.sessions, quotes: file.quotes });
  await dexieStore.apply(result.toLocal);
  schedulePush();
  return {
    books: result.toLocal.books.length,
    sessions: result.toLocal.sessions.length,
    quotes: result.toLocal.quotes.length,
  };
}

export const readFileText = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('The file could not be read.'));
    r.readAsText(file);
  });
