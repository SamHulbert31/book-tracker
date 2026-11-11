import { useState } from 'react';
import type { Book } from '../db/types';
import { finishBook } from '../db/repo';
import { Sheet } from '../components/Sheet';
import { Button } from '../components/Button';
import { Field, FieldGroup, FormError, Input, Textarea } from '../components/Field';
import { StarInput } from '../components/Stars';
import { todayISO } from '../lib/dates';

/** "Mark as finished": the date is required and defaults to today; rating and review are optional. */
export function FinishSheet({ book, onClose }: { book: Book; onClose: () => void }) {
  const today = todayISO();
  const [finishedAt, setFinishedAt] = useState(today);
  const [rating, setRating] = useState<number | undefined>(book.rating);
  const [review, setReview] = useState(book.review ?? '');
  const [error, setError] = useState('');

  async function save() {
    if (!finishedAt) return setError('Pick the date you finished.');
    if (book.startedAt && finishedAt < book.startedAt) return setError('The finish date cannot be before the start date.');
    await finishBook(book.id, { finishedAt, rating, review: review.trim() || undefined });
    onClose();
  }

  return (
    <Sheet
      title="Mark as finished"
      onClose={onClose}
      footer={
        <>
          {error && <FormError>{error}</FormError>}
          <Button block onClick={save}>
            Save
          </Button>
        </>
      }
    >
      <Field label="Finished">
        <Input type="date" value={finishedAt} max={today} onChange={(e) => setFinishedAt(e.target.value)} />
      </Field>
      <FieldGroup
        label="Rating (optional)"
        action={
          rating !== undefined && (
            <Button variant="quiet" style={{ minHeight: 44, minWidth: 44, padding: 0, fontSize: 12 }} onClick={() => setRating(undefined)}>
              Clear
            </Button>
          )
        }
      >
        <StarInput value={rating} onChange={setRating} />
      </FieldGroup>
      <Field label="Review (optional)">
        <Textarea value={review} onChange={(e) => setReview(e.target.value)} placeholder="What did you think?" />
      </Field>
    </Sheet>
  );
}
