import { useState } from 'react';
import type { Book, Session } from '../db/types';
import { deleteSession, updateSession } from '../db/repo';
import { Sheet } from '../components/Sheet';
import { Button } from '../components/Button';
import { Field, FieldRow, FormError, Input } from '../components/Field';
import { todayISO } from '../lib/dates';

/** Edit or delete one reading session. */
export function SessionSheet({ session, book, onClose }: { session: Session; book: Book; onClose: () => void }) {
  const [date, setDate] = useState(session.date);
  const [start, setStart] = useState(session.startPage !== undefined ? String(session.startPage) : '');
  const [end, setEnd] = useState(session.endPage !== undefined ? String(session.endPage) : '');
  const [minutes, setMinutes] = useState(String(Math.round(session.durationSec / 60)));
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  async function save() {
    if (!date) return setError('Pick a date.');
    const whole = (t: string) => /^\d+$/.test(t.trim());
    const s = start.trim();
    const e = end.trim();
    if ((s === '') !== (e === '')) return setError('Fill in both pages, or leave both empty.');
    if ((s && !whole(s)) || (e && !whole(e))) return setError('Pages should be whole numbers.');
    if (s && Number(e) < Number(s)) return setError('The end page cannot be before the start page.');
    if (e && book.pages && Number(e) > book.pages) return setError(`${book.title} has ${book.pages} pages.`);
    if (!whole(minutes)) return setError('Minutes should be a whole number. Use 0 if you did not time it.');
    await updateSession(session.id, {
      date,
      startPage: s ? Number(s) : undefined,
      endPage: e ? Number(e) : undefined,
      durationSec: Number(minutes) * 60,
    });
    onClose();
  }

  return (
    <Sheet
      title={confirming ? 'Delete this session?' : 'Edit session'}
      onClose={onClose}
      footer={
        confirming ? (
          <>
            <Button
              block
              style={{ background: 'var(--oxblood)', color: 'var(--on-green)' }}
              onClick={async () => {
                await deleteSession(session.id);
                onClose();
              }}
            >
              Delete session
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
            <Button block variant="danger" onClick={() => setConfirming(true)}>
              Delete session
            </Button>
          </>
        )
      }
    >
      {confirming ? (
        <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink-2)' }}>This session will be removed from {book.title}.</p>
      ) : (
        <>
          <Field label="Date">
            <Input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <FieldRow>
            <Field label="From page">
              <Input value={start} onChange={(e) => setStart(e.target.value)} inputMode="numeric" />
            </Field>
            <Field label="To page">
              <Input value={end} onChange={(e) => setEnd(e.target.value)} inputMode="numeric" />
            </Field>
          </FieldRow>
          <Field label="Minutes read">
            <Input value={minutes} onChange={(e) => setMinutes(e.target.value)} inputMode="numeric" />
          </Field>
        </>
      )}
    </Sheet>
  );
}
