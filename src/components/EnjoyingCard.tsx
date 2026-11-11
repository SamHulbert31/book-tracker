import { useMemo } from 'react';
import type { Book } from '../db/types';
import { enjoyingPlan, type EnjoyingResult } from '../ai/features';
import { useAiResult } from '../ai/useAi';
import { Card, Eyebrow } from './Card';
import styles from './AiCard.module.css';

/** The AI "What you are enjoying" card on Stats. Absent when there is no key, or no answer to show. */
export function EnjoyingCard({ books }: { books: Book[] }) {
  const plan = useMemo(() => enjoyingPlan(books), [books]);
  const ai = useAiResult<EnjoyingResult>('enjoying', plan);

  if (!ai.enabled || !plan || !ai.result) return null;
  return (
    <Card tone="green" gap={6}>
      <div className={styles.head}>
        <Eyebrow tone="gold">What you are enjoying</Eyebrow>
        <button type="button" className={styles.refreshOnGreen} onClick={() => void ai.refresh()} disabled={ai.busy}>
          {ai.busy ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      <p className={styles.summary}>{ai.result.summary}</p>
      {ai.error && <p className={styles.errorOnGreen}>{ai.error}</p>}
    </Card>
  );
}
