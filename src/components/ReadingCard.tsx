import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Book } from '../db/types';
import { Card, CardTitle, Eyebrow } from './Card';
import { Cover } from './Cover';
import styles from './ReadingCard.module.css';

interface ReadingCardProps {
  books: Book[];
  onLog: (book: Book) => void;
}

/** "Currently reading". With several books the cards swipe sideways. */
export function ReadingCard({ books, onLog }: ReadingCardProps) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  function onScroll() {
    const el = track.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  return (
    <div className={styles.wrap}>
      <div ref={track} className={styles.track} onScroll={onScroll}>
        {books.map((book) => (
          <div key={book.id} className={styles.slide}>
            <ReadingSlide book={book} onLog={onLog} />
          </div>
        ))}
      </div>
      {books.length > 1 && (
        <div className={styles.dots} aria-hidden="true">
          {books.map((book, i) => (
            <span key={book.id} className={i === index ? `${styles.dot} ${styles.activeDot}` : styles.dot} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReadingSlide({ book, onLog }: { book: Book; onLog: (book: Book) => void }) {
  const page = book.currentPage ?? 0;
  const percent = book.pages ? Math.min(100, Math.round((page / book.pages) * 100)) : undefined;
  const where = book.pages ? `page ${page} of ${book.pages}` : `page ${page}`;
  return (
    <Card row>
      <Link to={`/book/${book.id}`} className={styles.cover} aria-label={`Open ${book.title}`}>
        <Cover title={book.title} coverUrl={book.coverUrl} size="sm" />
      </Link>
      <div className={styles.body}>
        <Eyebrow>Currently reading</Eyebrow>
        <Link to={`/book/${book.id}`} className={styles.titleLink}>
          <CardTitle>{book.title}</CardTitle>
        </Link>
        <div className={styles.sub}>{[book.author || undefined, where].filter(Boolean).join(' · ')}</div>
        {percent !== undefined && (
          <div className={styles.bar} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label="Progress">
            <div className={styles.fill} style={{ width: `${percent}%` }} />
          </div>
        )}
        <div className={styles.footer}>
          <div className={styles.percent}>{percent !== undefined ? `${percent}%` : ''}</div>
          <button type="button" className={styles.log} onClick={() => onLog(book)}>
            Log a session
          </button>
        </div>
      </div>
    </Card>
  );
}
