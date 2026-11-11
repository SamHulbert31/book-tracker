import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Book, Quote } from '../db/types';
import { Card, Eyebrow } from './Card';
import { ShuffleIcon } from './Icons';
import { quoteMeta } from '../lib/quotes';
import styles from './QuoteCard.module.css';

export interface QuoteWithBook {
  quote: Quote;
  book: Book;
}

/** A random quote from the user's own. Open the screen and you get one; the button picks another. */
export function QuoteCard({ items }: { items: QuoteWithBook[] }) {
  // The first pick is random but stable for the life of the screen, so live updates do not reshuffle it.
  const [seed] = useState(() => Math.random());
  const [pickedId, setPickedId] = useState<string>();

  const current = items.find((i) => i.quote.id === pickedId) ?? items[Math.floor(seed * items.length) % items.length];

  function shuffle() {
    if (items.length < 2) return;
    const others = items.filter((i) => i.quote.id !== current.quote.id);
    setPickedId(others[Math.floor(Math.random() * others.length)].quote.id);
  }

  const { quote, book } = current;
  const meta = quoteMeta(quote);
  return (
    <Card tone="green" padding={20}>
      <Link to="/quotes" className={styles.eyebrowLink}>
        <Eyebrow tone="gold">From your quotes</Eyebrow>
      </Link>
      <p className={styles.text}>“{quote.text}”</p>
      <div className={styles.footer}>
        <Link to={`/book/${book.id}`} className={styles.source}>
          <span>
            {[book.title, book.author || undefined].filter(Boolean).join(', ')}
            {meta && <span className={styles.meta}> · {meta}</span>}
          </span>
        </Link>
        <button type="button" className={styles.shuffle} aria-label="Shuffle quote" onClick={shuffle} disabled={items.length < 2}>
          <ShuffleIcon />
        </button>
      </div>
    </Card>
  );
}
