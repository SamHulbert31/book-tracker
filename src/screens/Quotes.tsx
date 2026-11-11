import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { Book, Quote } from '../db/types';
import { useBooks, useQuotes } from '../db/hooks';
import { Screen } from '../components/Screen';
import { AddButton, ScreenHeader } from '../components/ScreenHeader';
import { BackLink } from '../components/BackLink';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { SearchIcon } from '../components/Icons';
import { QuoteSheet } from '../sheets/QuoteSheet';
import { quoteMeta } from '../lib/quotes';
import styles from './Quotes.module.css';

type SheetState = { kind: 'add' } | { kind: 'edit'; quote: Quote } | null;

/** Every quote, searchable, grouped by book. `?book=<id>` narrows it to one book. */
export function Quotes() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const onlyBook = params.get('book') ?? undefined;
  const books = useBooks();
  const quotes = useQuotes();
  const [query, setQuery] = useState('');
  const [sheet, setSheet] = useState<SheetState>(null);

  const groups = useMemo(() => {
    if (!books || !quotes) return undefined;
    const byId = new Map(books.map((b) => [b.id, b]));
    const q = query.trim().toLowerCase();
    const map = new Map<string, { book: Book; quotes: Quote[] }>();
    for (const quote of quotes) {
      const book = byId.get(quote.bookId);
      if (!book || (onlyBook && book.id !== onlyBook)) continue;
      if (q && !`${quote.text} ${quote.chapter ?? ''} ${book.title} ${book.author}`.toLowerCase().includes(q)) continue;
      const group = map.get(book.id) ?? { book, quotes: [] };
      group.quotes.push(quote);
      map.set(book.id, group);
    }
    const out = [...map.values()];
    for (const g of out) g.quotes.sort((a, b) => (a.page ?? Infinity) - (b.page ?? Infinity) || a.createdAt.localeCompare(b.createdAt));
    // Books with the most recently saved quote come first.
    const latest = (g: { quotes: Quote[] }) => g.quotes.reduce((m, x) => (x.createdAt > m ? x.createdAt : m), '');
    return out.sort((a, b) => latest(b).localeCompare(latest(a)));
  }, [books, quotes, query, onlyBook]);

  const filteredBook = onlyBook ? books?.find((b) => b.id === onlyBook) : undefined;
  const total = quotes?.length ?? 0;
  const hasBooks = (books?.length ?? 0) > 0;
  // New quotes from here start on the book being filtered, otherwise the most recently started one.
  const pickable = useMemo(() => {
    const list = [...(books ?? [])].sort((a, b) => (b.status === 'reading' ? 1 : 0) - (a.status === 'reading' ? 1 : 0) || a.title.localeCompare(b.title));
    return filteredBook ? [filteredBook, ...list.filter((b) => b.id !== filteredBook.id)] : list;
  }, [books, filteredBook]);

  return (
    <Screen gap={16} compactTop>
      <BackLink to={onlyBook ? `/book/${onlyBook}` : '/library'}>{filteredBook ? filteredBook.title : 'Library'}</BackLink>
      <ScreenHeader title="Quotes" action={hasBooks ? <AddButton label="Add a quote" onClick={() => setSheet({ kind: 'add' })} /> : undefined} />

      {total > 0 && (
        <div className={styles.search}>
          <SearchIcon />
          <label htmlFor="quote-search" className="visually-hidden">
            Search your quotes
          </label>
          <input
            id="quote-search"
            type="search"
            className={styles.input}
            placeholder="Search quotes, books or authors"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}

      {onlyBook && filteredBook && (
        <div className={styles.filtering}>
          <span>Showing quotes from {filteredBook.title}</span>
          <button type="button" className={styles.showAll} onClick={() => setParams({})}>
            Show all
          </button>
        </div>
      )}

      {groups === undefined ? null : groups.length > 0 ? (
        groups.map(({ book, quotes: list }) => (
          <section key={book.id} className={styles.group} aria-label={book.title}>
            <header className={styles.groupHead}>
              <Link to={`/book/${book.id}`} className={styles.bookLink}>
                {book.title}
              </Link>
              {book.author && <div className={styles.author}>{book.author}</div>}
            </header>
            {list.map((quote) => (
              <button key={quote.id} type="button" className={styles.quote} onClick={() => setSheet({ kind: 'edit', quote })} aria-label={`Edit quote: ${quote.text.slice(0, 40)}`}>
                <span className={styles.text}>“{quote.text}”</span>
                {quoteMeta(quote) && <span className={styles.meta}>{quoteMeta(quote)}</span>}
              </button>
            ))}
          </section>
        ))
      ) : total === 0 ? (
        <EmptyState
          title="No quotes yet"
          action={hasBooks ? <Button onClick={() => setSheet({ kind: 'add' })}>Add a quote</Button> : <Button onClick={() => navigate('/add')}>Add a book</Button>}
        >
          {hasBooks ? 'Save lines you love from your books. They show up here, and shuffle on your home screen.' : 'Quotes belong to a book, so add a book first.'}
        </EmptyState>
      ) : (
        <EmptyState title="No matches">Nothing matches that search.</EmptyState>
      )}

      {sheet?.kind === 'add' && <QuoteSheet books={pickable} bookId={pickable[0]?.id} onClose={() => setSheet(null)} />}
      {sheet?.kind === 'edit' && <QuoteSheet quote={sheet.quote} books={pickable} onClose={() => setSheet(null)} />}
    </Screen>
  );
}
