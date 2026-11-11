import type { ReactNode } from 'react';
import styles from './Screen.module.css';

interface ScreenProps {
  children: ReactNode;
  /** Gap between sections: 16 on Home and Library, 14 on Stats and Book detail. */
  gap?: 14 | 16;
  /** Book detail starts closer to the top because it has its own back bar. */
  compactTop?: boolean;
}

/** Page padding, safe areas and vertical rhythm shared by every screen. */
export function Screen({ children, gap = 16, compactTop = false }: ScreenProps) {
  const cls = compactTop ? `${styles.screen} ${styles.compactTop}` : styles.screen;
  return (
    <div className={cls} style={{ gap }}>
      {children}
    </div>
  );
}
