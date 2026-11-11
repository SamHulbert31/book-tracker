import type { ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: ReactNode;
  /** "default" is the parchment card, "green" is the feature card. */
  tone?: 'default' | 'green';
  gap?: 6 | 10 | 12;
  padding?: 16 | 20;
  /** Lay children out in a row (used by the currently reading card). */
  row?: boolean;
}

export function Card({ children, tone = 'default', gap = 12, padding = 16, row = false }: CardProps) {
  const cls = [styles.card, tone === 'green' ? styles.green : '', row ? styles.row : ''].filter(Boolean).join(' ');
  return (
    <section className={cls} style={{ gap: row ? 14 : gap, padding }}>
      {children}
    </section>
  );
}

/** Small uppercase label, e.g. "Currently reading". */
export function Eyebrow({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'gold' | 'oxblood' }) {
  return <div className={`${styles.eyebrow} ${styles[tone]}`}>{children}</div>;
}

/** Fraunces heading used inside cards. */
export function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className={styles.title}>{children}</h2>;
}

/** Title on the left and a quiet caption on the right. */
export function CardHeading({ title, aside }: { title: string; aside?: string }) {
  return (
    <div className={styles.heading}>
      <CardTitle>{title}</CardTitle>
      {aside && <div className={styles.aside}>{aside}</div>}
    </div>
  );
}
