import { useState } from 'react';
import { AddButton, ScreenHeader } from '../components/ScreenHeader';
import { Screen } from '../components/Screen';
import { Segmented } from '../components/Segmented';
import { EmptyState, PrimaryButton } from '../components/EmptyState';
import { SearchIcon } from '../components/Icons';
import styles from './Library.module.css';

type Shelf = 'read' | 'reading' | 'tbr';

const EMPTY: Record<Shelf, { title: string; body: string }> = {
  read: { title: 'No finished books yet', body: 'Books you finish will line up here, newest first.' },
  reading: { title: 'Nothing on the go', body: 'Start a book from your TBR, or add a new one.' },
  tbr: { title: 'Your TBR is empty', body: 'Add the books you want to read next.' },
};

const SORT_LABEL: Record<Shelf, string> = {
  read: 'Sorted by date finished',
  reading: 'Sorted by date started',
  tbr: 'Sorted by date added',
};

export function Library() {
  const [shelf, setShelf] = useState<Shelf>('read');
  const [query, setQuery] = useState('');

  const counts: Record<Shelf, number> = { read: 0, reading: 0, tbr: 0 };

  return (
    <Screen gap={16}>
      <ScreenHeader title="Library" action={<AddButton />} />

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

      <Segmented<Shelf>
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
        <div>{SORT_LABEL[shelf]}</div>
        <button type="button" className={styles.filter}>
          Filter
        </button>
      </div>

      <EmptyState
        title={EMPTY[shelf].title}
        action={<PrimaryButton>Add a book</PrimaryButton>}
      >
        {EMPTY[shelf].body}
      </EmptyState>
    </Screen>
  );
}
