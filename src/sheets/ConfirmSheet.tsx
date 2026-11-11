import { Sheet } from '../components/Sheet';
import { Button } from '../components/Button';

interface ConfirmSheetProps {
  title: string;
  message: string;
  confirmLabel: string;
  /** Styles the confirm button as destructive. */
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmSheet({ title, message, confirmLabel, danger = false, onConfirm, onClose }: ConfirmSheetProps) {
  return (
    <Sheet
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button
            block
            onClick={onConfirm}
            style={danger ? { background: 'var(--oxblood)', color: 'var(--on-green)' } : undefined}
          >
            {confirmLabel}
          </Button>
          <Button block variant="quiet" onClick={onClose}>
            Cancel
          </Button>
        </>
      }
    >
      <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink-2)' }}>{message}</p>
    </Sheet>
  );
}
