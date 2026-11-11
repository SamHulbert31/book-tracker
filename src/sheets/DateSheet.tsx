import { useState } from 'react';
import { Sheet } from '../components/Sheet';
import { Button } from '../components/Button';
import { Field, FormError, Input } from '../components/Field';
import { todayISO } from '../lib/dates';

interface DateSheetProps {
  title: string;
  label: string;
  value?: string;
  /** Earliest allowed date, e.g. the start date when editing the finish date. */
  min?: string;
  /** Latest allowed date. */
  max?: string;
  /** Whether the date can be removed. */
  clearable?: boolean;
  onSave: (value: string | undefined) => void;
  onClose: () => void;
}

export function DateSheet({ title, label, value, min, max, clearable = false, onSave, onClose }: DateSheetProps) {
  const [date, setDate] = useState(value ?? todayISO());
  const [error, setError] = useState('');

  function save() {
    if (!date) return setError('Pick a date.');
    if (min && date < min) return setError('That date is before the start date.');
    if (max && date > max) return setError('That date is after the finish date.');
    onSave(date);
  }

  return (
    <Sheet
      title={title}
      onClose={onClose}
      footer={
        <>
          {error && <FormError>{error}</FormError>}
          <Button block onClick={save}>
            Save
          </Button>
          {clearable && value && (
            <Button block variant="danger" onClick={() => onSave(undefined)}>
              Remove date
            </Button>
          )}
        </>
      }
    >
      <Field label={label}>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
    </Sheet>
  );
}
