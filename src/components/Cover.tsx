import { useState } from 'react';
import { coverColour } from '../lib/covers';
import styles from './Cover.module.css';

type Size = 'xs' | 'sm' | 'md' | 'lg';

interface CoverProps {
  title: string;
  coverUrl?: string;
  /** xs: search results, sm: home card, md: library grid (fills its column), lg: book detail. */
  size: Size;
}

/** The cover image when there is one, otherwise a coloured block with the title on it. */
export function Cover({ title, coverUrl, size }: CoverProps) {
  const [failedUrl, setFailedUrl] = useState<string>();
  const showImage = Boolean(coverUrl) && coverUrl !== failedUrl;
  return (
    <div className={`${styles.cover} ${styles[size]}`} style={showImage ? undefined : { background: coverColour(title) }}>
      {showImage ? (
        <img src={coverUrl} alt="" loading="lazy" onError={() => setFailedUrl(coverUrl)} />
      ) : (
        <span className={styles.title}>{title}</span>
      )}
      <span className={styles.spine} aria-hidden="true" />
    </div>
  );
}
