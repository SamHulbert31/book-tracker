import type { ReactNode } from 'react';
import { PlusIcon } from './Icons';
import styles from './ScreenHeader.module.css';

interface ScreenHeaderProps {
  title: string;
  /** Small line above the title (Home shows the date). */
  eyebrow?: string;
  action?: ReactNode;
}

export function ScreenHeader({ title, eyebrow, action }: ScreenHeaderProps) {
  return (
    <header className={styles.header}>
      <div>
        {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
        <h1 className={eyebrow ? `${styles.title} ${styles.withEyebrow}` : styles.title}>{title}</h1>
      </div>
      {action}
    </header>
  );
}

/** The round "+" button at the right of a screen header. */
export function AddButton({ onClick }: { onClick?: () => void }) {
  return (
    <button type="button" className={styles.add} aria-label="Add a book" onClick={onClick}>
      <PlusIcon />
    </button>
  );
}
