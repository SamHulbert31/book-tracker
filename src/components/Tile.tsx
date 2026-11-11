import styles from './Tile.module.css';

interface TileProps {
  value: string;
  label: string;
  /** Roomier padding for the two column tiles on Stats. */
  wide?: boolean;
}

/** A single number with a caption. */
export function Tile({ value, label, wide = false }: TileProps) {
  return (
    <div className={wide ? `${styles.tile} ${styles.wide}` : styles.tile}>
      <div className={styles.value}>{value}</div>
      <div className={styles.label}>{label}</div>
    </div>
  );
}
