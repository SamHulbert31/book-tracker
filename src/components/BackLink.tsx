import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from './Icons';
import styles from './BackLink.module.css';

/** "‹ Library" style link at the top of a sub screen. */
export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className={styles.back}>
      <ChevronLeftIcon />
      {children}
    </Link>
  );
}
