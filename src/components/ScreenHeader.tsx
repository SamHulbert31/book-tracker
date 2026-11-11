import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, SettingsIcon } from './Icons';
import styles from './ScreenHeader.module.css';

interface ScreenHeaderProps {
  title: string;
  /** Small line above the title (Home shows the date). */
  eyebrow?: ReactNode;
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
export function AddButton({ onClick, label = 'Add a book' }: { onClick?: () => void; label?: string }) {
  return (
    <button type="button" className={styles.add} aria-label={label} onClick={onClick}>
      <PlusIcon />
    </button>
  );
}

/** Round outline button linking to Settings, shown beside the add button on Home. */
export function SettingsLink() {
  return (
    <Link to="/settings" className={styles.ghost} aria-label="Settings">
      <SettingsIcon />
    </Link>
  );
}
