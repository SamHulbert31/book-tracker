import { useEffect, useRef, useState, type FocusEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './Sheet.module.css';

interface SheetProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Pinned under the scrolling body, usually the save button. */
  footer?: ReactNode;
}

/**
 * The area of the screen that is actually visible. On phones the on-screen
 * keyboard shrinks the visual viewport without resizing the layout viewport, so
 * the sheet is sized to the visual one to keep the focused field in view.
 */
function useVisibleBox() {
  const [box, setBox] = useState({ top: 0, height: window.innerHeight });
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setBox({ top: vv.offsetTop, height: vv.height });
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);
  return box;
}

/** A bottom sheet. Render it only while it is open. */
export function Sheet({ title, onClose, children, footer }: SheetProps) {
  const box = useVisibleBox();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus the panel (not a field) so the keyboard does not open by itself.
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Once the keyboard has finished opening, bring the field being typed in to the middle.
  function onFocus(e: FocusEvent<HTMLDivElement>) {
    const el = e.target;
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) return;
    window.setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300);
  }

  return createPortal(
    <div className={styles.layer} style={{ top: box.top, height: box.height }}>
      <div className={styles.backdrop} onClick={onClose} />
      <div
        ref={panel}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onFocus={onFocus}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>
        <div className={styles.body}>{children}</div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
