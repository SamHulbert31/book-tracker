import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Book } from '../db/types';
import { useBooks } from '../db/hooks';
import { addBook } from '../db/repo';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { Button } from '../components/Button';
import { Cover } from '../components/Cover';
import { EmptyState } from '../components/EmptyState';
import { BackLink } from '../components/BackLink';
import { SearchIcon } from '../components/Icons';
import { BookEditorSheet } from '../sheets/BookEditorSheet';
import { resultToDraft, searchBooks, searchErrorMessage, type SearchResult } from '../lib/openLibrary';
import styles from './AddBook.module.css';

type SearchState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'done'; results: SearchResult[] }
  | { kind: 'error'; message: string };

export function AddBook() {
  const navigate = useNavigate();
  const books = useBooks();
  const [query, setQuery] = useState('');
  const [state, setState] = useState<SearchState>({ kind: 'idle' });
  // Non-null while the sheet is open. Empty means manual entry.
  const [draft, setDraft] = useState<Partial<Book> | null>(null);

  // Debounced search; an older request is cancelled when the text changes.
  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) {
      setState({ kind: 'idle' });
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setState({ kind: 'loading' });
      try {
        const results = await searchBooks(text, controller.signal);
        setState({ kind: 'done', results });
      } catch (error) {
        if (controller.signal.aborted) return;
        setState({ kind: 'error', message: searchErrorMessage(error) });
      }
    }, 400);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const inLibrary = new Set((books ?? []).map((b) => b.openLibraryKey).filter(Boolean));

  return (
    <Screen gap={16} compactTop>
      <BackLink to="/library">Library</BackLink>
      <ScreenHeader title="Add a book" />

      <div className={styles.search}>
        <SearchIcon />
        <label htmlFor="add-search" className="visually-hidden">
          Search by title or author
        </label>
        <input
          id="add-search"
          type="search"
          className={styles.input}
          placeholder="Search by title or author"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {state.kind === 'idle' && <p className={styles.hint}>Search Open Library, or add a book by hand if you cannot find it.</p>}
      {state.kind === 'loading' && (
        <p className={styles.hint} role="status">
          Searching…
        </p>
      )}
      {state.kind === 'error' && (
        <p className={styles.error} role="alert">
          {state.message}
        </p>
      )}

      {state.kind === 'done' && state.results.length === 0 && (
        <EmptyState title="No results" action={<Button onClick={() => setDraft({ title: query.trim() })}>Add it by hand</Button>}>
          Nothing matched that search. Try fewer words, or add the book yourself.
        </EmptyState>
      )}

      {state.kind === 'done' && state.results.length > 0 && (
        <ul className={styles.results}>
          {state.results.map((result) => (
            <li key={result.key}>
              <button type="button" className={styles.result} onClick={() => setDraft(resultToDraft(result))}>
                <Cover title={result.title} coverUrl={result.coverUrl} size="xs" />
                <span className={styles.text}>
                  <span className={styles.title}>{result.title}</span>
                  <span className={styles.meta}>
                    {[result.author, result.year, result.pages ? `${result.pages} pages` : undefined].filter(Boolean).join(' · ')}
                  </span>
                  {inLibrary.has(result.key) && <span className={styles.badge}>In your library</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button variant="outline" block onClick={() => setDraft({ title: '' })}>
        Add a book by hand
      </Button>

      {draft && (
        <BookEditorSheet
          title="Add book"
          saveLabel="Add to library"
          initial={draft}
          onClose={() => setDraft(null)}
          onSave={async (values) => {
            const book = await addBook({
              ...values,
              coverUrl: draft.coverUrl,
              isbn: draft.isbn,
              openLibraryKey: draft.openLibraryKey,
            });
            navigate(`/book/${book.id}`, { replace: true });
          }}
        />
      )}
    </Screen>
  );
}
