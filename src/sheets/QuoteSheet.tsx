import { useState } from 'react';
import type { Book, Quote } from '../db/types';
import { addQuote, deleteQuote, updateQuote } from '../db/repo';
import { Sheet } from '../components/Sheet';
import { Button } from '../components/Button';
import { Field, FieldRow, FormError, Input, Select, Textarea } from '../components/Field';

interface QuoteSheetProps {
  /** Editing when present, adding when absent. */
  quote?: Quote;
  /** The book for a new quote. */
  bookId?: string;
  /** When given, shows a book picker (used from the all quotes screen). */
  books?: Book[];
  onClose: () => void;
}

export function QuoteSheet({ quote, bookId, books, onClose }: QuoteSheetProps) {
  const [chosenBook, setChosenBook] = useState(quote?.bookId ?? bookId ?? books?.[0]?.id ?? '');
  const [text, setText] = useState(quote?.text ?? '');
  const [page, setPage] = useState(quote?.page !== undefined ? String(quote.page) : '');
  const [chapter, setChapter] = useState(quote?.chapter ?? '');
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  async function save() {
    if (!text.trim()) return setError('Type or paste the quote.');
    if (!chosenBook) return setError('Pick the book it comes from.');
    if (page.trim() && !/^\d+$/.test(page.trim())) return setError('Page should be a whole number.');
    const values = { text: text.trim(), page: page.trim() ? Number(page.trim()) : undefined, chapter: chapter.trim() || undefined };
    if (quote) await updateQuote(quote.id, { ...values, bookId: chosenBook });
    else await addQuote({ ...values, bookId: chosenBook });
    onClose();
  }

  return (
    <Sheet
      title={confirming ? 'Delete this quote?' : quote ? 'Edit quote' : 'Add quote'}
      onClose={onClose}
      footer={
        confirming ? (
          <>
            <Button
              block
              style={{ background: 'var(--oxblood)', color: 'var(--on-green)' }}
              onClick={async () => {
                if (quote) await deleteQuote(quote.id);
                onClose();
              }}
            >
              Delete quote
            </Button>
            <Button block variant="quiet" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            {error && <FormError>{error}</FormError>}
            <Button block onClick={save}>
              Save
            </Button>
            {quote && (
              <Button block variant="danger" onClick={() => setConfirming(true)}>
                Delete quote
              </Button>
            )}
          </>
        )
      }
    >
      {confirming ? (
        <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink-2)' }}>“{quote?.text}”</p>
      ) : (
        <>
          {books && (
            <Field label="Book">
              <Select value={chosenBook} onChange={(e) => setChosenBook(e.target.value)}>
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.author ? `${b.title}, ${b.author}` : b.title}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Quote">
            <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="The line you want to keep" />
          </Field>
          <FieldRow>
            <Field label="Chapter (optional)">
              <Input value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="Chapter 11" />
            </Field>
            <Field label="Page (optional)">
              <Input value={page} onChange={(e) => setPage(e.target.value)} inputMode="numeric" />
            </Field>
          </FieldRow>
        </>
      )}
    </Sheet>
  );
}
