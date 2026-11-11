import { useState } from 'react';
import { Sheet } from '../components/Sheet';
import { Button } from '../components/Button';
import { Field, Textarea } from '../components/Field';

export function ReviewSheet({ value, onSave, onClose }: { value?: string; onSave: (value: string | undefined) => void; onClose: () => void }) {
  const [text, setText] = useState(value ?? '');
  return (
    <Sheet
      title="My review"
      onClose={onClose}
      footer={
        <Button block onClick={() => onSave(text.trim() || undefined)}>
          Save
        </Button>
      }
    >
      <Field label="Review">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="What did you think?" style={{ minHeight: 180 }} />
      </Field>
    </Sheet>
  );
}
