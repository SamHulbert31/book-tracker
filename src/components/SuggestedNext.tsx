import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Book } from '../db/types';
import { addBook } from '../db/repo';
import { suggestedNextPlan, type SuggestedNextResult } from '../ai/features';
import { useAiResult } from '../ai/useAi';
import { Card, CardTitle, Eyebrow } from './Card';
import { Button } from './Button';
import styles from './AiCard.module.css';

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

/** The AI "Suggested next" card on Home. Absent when there is no key, or nothing usable to show. */
export function SuggestedNext({ books }: { books: Book[] }) {
  const plan = useMemo(() => suggestedNextPlan(books), [books]);
  const ai = useAiResult<SuggestedNextResult>('suggestedNext', plan);
  const [added, setAdded] = useState<Set<string>>(new Set());

  if (!ai.enabled || !plan) return null;
  const result = ai.result;
  if (!result) {
    return ai.busy ? (
      <Card gap={6}>
        <Eyebrow tone="oxblood">Suggested next</Eyebrow>
        <p className={styles.muted}>Finding a pick…</p>
      </Card>
    ) : null;
  }

  // Cached answers can be a little old: only show what is still true of the library.
  const pickBook = result.pick ? books.find((b) => b.id === result.pick!.bookId && b.status === 'tbr') : undefined;
  const have = new Set(books.map((b) => `${norm(b.title)}|${norm(b.author)}`));
  const discoveries = result.discoveries.filter((d) => !have.has(`${norm(d.title)}|${norm(d.author)}`) || added.has(d.title));
  if (!pickBook && discoveries.length === 0) return null;

  return (
    <Card gap={6}>
      <Eyebrow tone="oxblood">Suggested next</Eyebrow>
      {pickBook && result.pick && (
        <>
          <Link to={`/book/${pickBook.id}`} className={styles.titleLink}>
            <CardTitle>{[pickBook.title, pickBook.author || undefined].filter(Boolean).join(', ')}</CardTitle>
          </Link>
          <p className={styles.reason}>{result.pick.reason}</p>
        </>
      )}
      {discoveries.length > 0 && (
        <div className={styles.more}>
          <div className={styles.moreLabel}>You might also like</div>
          {discoveries.map((d) => (
            <div key={`${d.title}|${d.author}`} className={styles.row}>
              <div className={styles.rowText}>
                <div className={styles.rowTitle}>{[d.title, d.author || undefined].filter(Boolean).join(', ')}</div>
                {d.reason && <div className={styles.rowReason}>{d.reason}</div>}
              </div>
              {added.has(d.title) ? (
                <span className={styles.added}>Added</span>
              ) : (
                <Button
                  variant="outline"
                  className={styles.add}
                  onClick={async () => {
                    await addBook({ title: d.title, author: d.author, genres: [], status: 'tbr' });
                    setAdded((s) => new Set(s).add(d.title));
                  }}
                >
                  Add to TBR
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
      <div className={styles.footer}>
        {ai.error && <span className={styles.error}>{ai.error}</span>}
        <button type="button" className={styles.refresh} onClick={() => void ai.refresh()} disabled={ai.busy}>
          {ai.busy ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
    </Card>
  );
}
