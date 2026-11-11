import { useState } from 'react';
import { addBooks } from '../db/repo';
import { Sheet } from '../components/Sheet';
import { Button } from '../components/Button';
import { FormError } from '../components/Field';
import type { ImportPlan } from '../lib/goodreads';

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** The summary shown before a Goodreads import is committed. */
export function GoodreadsSheet({ plan, onDone, onClose }: { plan: ImportPlan; onDone: (added: number) => void; onClose: () => void }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { counts } = plan;

  async function commit() {
    setBusy(true);
    try {
      onDone(await addBooks(plan.toAdd));
    } catch {
      setError('Could not save the books. Nothing was imported.');
      setBusy(false);
    }
  }

  return (
    <Sheet
      title="Import from Goodreads"
      onClose={onClose}
      footer={
        <>
          {error && <FormError>{error}</FormError>}
          {plan.toAdd.length > 0 && (
            <Button block disabled={busy} onClick={commit}>
              {busy ? 'Importing…' : `Import ${plural(plan.toAdd.length, 'book')}`}
            </Button>
          )}
          <Button block variant="quiet" onClick={onClose}>
            {plan.toAdd.length > 0 ? 'Cancel' : 'Close'}
          </Button>
        </>
      }
    >
      <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink-2)' }}>
        {plan.total === 0 ? 'The file has no books in it.' : `The file has ${plural(plan.total, 'book')}.`}
      </p>
      {plan.toAdd.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)' }}>
          <li>{counts.read} read</li>
          <li>{counts.reading} reading</li>
          <li>{counts.tbr} to read</li>
        </ul>
      )}
      {plan.duplicates > 0 && (
        <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--muted)' }}>
          {plural(plan.duplicates, 'book')} already in your library will be skipped.
        </p>
      )}
      {plan.readWithoutDate > 0 && (
        <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--muted)' }}>
          {plural(plan.readWithoutDate, 'read book')} {plan.readWithoutDate === 1 ? 'has' : 'have'} no date read in Goodreads, so {plan.readWithoutDate === 1 ? 'it' : 'they'} will not count in dated stats until you add one.
        </p>
      )}
    </Sheet>
  );
}
