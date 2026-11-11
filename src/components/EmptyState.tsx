import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}

/** Friendly placeholder for a screen or card with nothing in it yet. */
export function EmptyState({ title, children, action }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.body}>{children}</p>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
