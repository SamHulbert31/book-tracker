import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Book, Status } from '../db/types';
import { useBooks } from '../db/hooks';
import { startReading } from '../db/repo';
import { AddButton, ScreenHeader } from '../components/ScreenHeader';
import { Screen } from '../components/Screen';
import { Segmented } from '../components/Segmented';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { SearchIcon } from '../components/Icons';
import { Cover } from '../components/Cover';
import { Stars } from '../components/Stars';
import { FilterSheet, NO_FILTERS, SORT_LABELS, type LibraryFilters, type SortKey } from '../sheets/FilterSheet';
import styles from './Library.module.css';

const SORTS_BY_SHELF: Record<Status, SortKey[]> = {
  read: ['finished', 'rating', 'title', 'author', 'added'],
  reading: ['added', 'title', 'author'],
  tbr: ['added', 'title', 'author'],
};

const DEFAULT_SORT: Record<Status, SortKey> = { read: 'finished', reading: 'added', tbr: 'added' };

const EMPTY: Record<Status, { title: string; body: string }> = {
  read: { title: 'No finished books yet', body: 'Books you finish will line up here, newest first.' },
  reading: { title: 'Nothing on the go', body: 'Start a book from your TBR, or add a new one.' },
  tbr: { title: 'Your TBR is empty', body: 'Add the books you want to read next.' },
};

const byText = (a: string, b: string) => a.localeCompare(b, 'en', { sensitivity: 'base' });

function comparator(sort: SortKey): (a: Book, b: Book) => number {
  switch (sort) {
    case 'finished':
      return (a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? '') || byText(a.title, b.title);
    case 'rating':
      return (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || byText(a.title, b.title);
    case 'title':
      return (a, b) => byText(a.title, b.title);
    case 'author':
      return (a, b) => byText(a.author, b.author) || byText(a.title, b.title);
    case 'added':
      return (a, b) => b.createdAt.localeCompare(a.createdAt);
  }
}

export function Library() {
  const navigate = useNavigate();
  const books = useBooks();
  const [shelf, setShelf] = useState<Status>('read');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('finished');
  const [filters, setFilters] = useState<LibraryFilters>(NO_FILTERS);
  const [showSheet, setShowSheet] = useState(false);

  const sortOptions = SORTS_BY_SHELF[shelf];
  const activeSort = sortOptions.includes(sort) ? sort : DEFAULT_SORT[shelf];
  const ratingFilter = shelf === 'read' ? filters.minRating : 0;
  const filterCount = filters.genres.length + (ratingFilter > 0 ? 1 : 0);

  const counts = useMemo(() => {
    const c: Record<Status, number> = { read: 0, reading: 0, tbr: 0 };
    for (const b of books ?? []) c[b.status]++;
    return c;
  }, [books]);

  const genresInUse = useMemo(() => [...new Set((books ?? []).filter((b) => b.status === shelf).flatMap((b) => b.genres))], [books, shelf]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (books ?? [])
      .filter((b) => b.status === shelf)
      .filter((b) => !q || `${b.title} ${b.author} ${b.genres.join(' ')}`.toLowerCase().includes(q))
      .filter((b) => filters.genres.length === 0 || b.genres.some((g) => filters.genres.includes(g)))
      .filter((b) => ratingFilter === 0 || (b.rating ?? 0) >= ratingFilter)
      .sort(comparator(activeSort));
  }, [books, shelf, query, filters.genres, ratingFilter, activeSort]);

  const addBook = () => navigate('/add');
  const hasAny = (books?.length ?? 0) > 0;
  const narrowed = query.trim() !== '' || filterCount > 0;

  return (
    <Screen gap={16}>
      <ScreenHeader title="Library" action={<AddButton onClick={addBook} />} />

      <div className={styles.search}>
        <SearchIcon />
        <label htmlFor="library-search" className="visually-hidden">
          Search your library
        </label>
        <input
          id="library-search"
          type="search"
          className={styles.input}
          placeholder="Search title, author or genre"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Segmented<Status>
        label="Shelf"
        value={shelf}
        onChange={setShelf}
        options={[
          { value: 'read', label: `Read · ${counts.read}` },
          { value: 'reading', label: `Reading · ${counts.reading}` },
          { value: 'tbr', label: `TBR · ${counts.tbr}` },
        ]}
      />

      <div className={styles.sortRow}>
        <button type="button" className={styles.sortLabel} onClick={() => setShowSheet(true)}>
          Sorted by {SORT_LABELS[activeSort]}
        </button>
        <button type="button" className={styles.filter} onClick={() => setShowSheet(true)}>
          {filterCount > 0 ? `Filter · ${filterCount}` : 'Filter'}
        </button>
      </div>

      {books === undefined ? null : visible.length > 0 ? (
        <div className={styles.grid}>
          {visible.map((book) => (
            <BookTile key={book.id} book={book} />
          ))}
        </div>
      ) : narrowed ? (
        <EmptyState
          title="No matches"
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQuery('');
                setFilters(NO_FILTERS);
              }}
            >
              Clear search and filters
            </Button>
          }
        >
          Nothing on this shelf matches. Try a different search.
        </EmptyState>
      ) : (
        <EmptyState title={hasAny ? EMPTY[shelf].title : 'Your library is empty'} action={<Button onClick={addBook}>Add a book</Button>}>
          {hasAny ? EMPTY[shelf].body : 'Add your first book and it will show up here.'}
        </EmptyState>
      )}

      {showSheet && (
        <FilterSheet
          sortOptions={sortOptions}
          sort={activeSort}
          onSort={setSort}
          filters={{ ...filters, minRating: ratingFilter }}
          onFilters={setFilters}
          showRating={shelf === 'read'}
          genresInUse={genresInUse}
          onClose={() => setShowSheet(false)}
        />
      )}
    </Screen>
  );
}

function BookTile({ book }: { book: Book }) {
  const progress = book.pages && book.currentPage ? Math.min(100, Math.round((book.currentPage / book.pages) * 100)) : 0;
  return (
    <div className={styles.tile}>
      <Link to={`/book/${book.id}`} className={styles.tileLink} aria-label={book.author ? `${book.title} by ${book.author}` : book.title}>
        <Cover title={book.title} coverUrl={book.coverUrl} size="md" />
        <div className={styles.author}>{book.author || 'Unknown author'}</div>
        {book.status === 'read' && book.rating !== undefined && <Stars rating={book.rating} size={14} />}
        {book.status === 'reading' && (
          <div className={styles.progress} role="img" aria-label={`${progress} percent read`}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        )}
      </Link>
      {book.status === 'tbr' && (
        <button type="button" className={styles.start} onClick={() => startReading(book.id)}>
          Start reading
        </button>
      )}
    </div>
  );
}
