import { useState } from 'react';
import type { Book } from '../db/types';
import { logPages } from '../db/repo';
import { Sheet } from '../components/Sheet';
import { Button } from '../components/Button';
import { Field, FormError, Input } from '../components/Field';

interface LogSessionSheetProps {
  book: Book;
  onClose: () => void;
  /** Called after the page is saved. `finished` is true when it reached the last page. */
  onSaved: (finished: boolean) => void;
  onStartTimer: () => void;
}

/** The quick "Log a session": update the current page, or start a timed session. */
export function LogSessionSheet({ book, onClose, onSaved, onStartTimer }: LogSessionSheetProps) {
  const [page, setPage] = useState(String(book.currentPage ?? 0));
  const [error, setError] = useState('');

  async function save() {
    const text = page.trim();
    if (!/^\d+$/.test(text)) return setError('Enter the page you are on, as a whole number.');
    const n = Number(text);
    if (book.pages && n > book.pages) return setError(`${book.title} has ${book.pages} pages.`);
    await logPages(book, n);
    onSaved(Boolean(book.pages) && n >= (book.pages ?? Infinity));
  }

  return (
    <Sheet
      title="Log a session"
      onClose={onClose}
      footer={
        <>
          {error && <FormError>{error}</FormError>}
          <Button block onClick={save}>
            Save page
          </Button>
          <Button block variant="outline" onClick={onStartTimer}>
            Start a timed session
          </Button>
        </>
      }
    >
      <p style={{ fontSize: 14, color: 'var(--muted)' }}>
        {book.title}
        {book.pages ? ` · ${book.pages} pages` : ''}
      </p>
      <Field label="Current page">
        <Input value={page} onChange={(e) => setPage(e.target.value)} inputMode="numeric" />
      </Field>
    </Sheet>
  );
}
