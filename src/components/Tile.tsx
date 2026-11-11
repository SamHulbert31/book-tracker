import styles from './Tile.module.css';

interface TileProps {
  value: string;
  label: string;
  /** Roomier padding for the two column tiles on Stats. */
  wide?: boolean;
  /** Book detail style: caption on top, small value underneath. */
  compact?: boolean;
}

/** A single number with a caption. */
export function Tile({ value, label, wide = false, compact = false }: TileProps) {
  const cls = [styles.tile, wide ? styles.wide : '', compact ? styles.compact : ''].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      <div className={styles.value}>{value}</div>
      <div className={styles.label}>{label}</div>
    </div>
  );
}
