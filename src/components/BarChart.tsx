import styles from './BarChart.module.css';

interface BarChartProps {
  values: number[];
  labels: string[];
  /** Index of the bar drawn in green. */
  highlight?: number;
  /** Height of the whole chart in px (Home 72, Stats 84). */
  height: number;
  /** Height in px of the tallest bar. */
  barMax: number;
  /** The value that fills barMax. Defaults to the largest value. */
  scaleMax?: number;
  ariaLabel: string;
}

const EMPTY_BAR = 3;

/** Hand built bar chart: one flex column per bar, label underneath. */
export function BarChart({ values, labels, highlight, height, barMax, scaleMax, ariaLabel }: BarChartProps) {
  const max = scaleMax ?? Math.max(...values, 0);
  return (
    <div className={styles.chart} style={{ height }} role="img" aria-label={ariaLabel}>
      {values.map((value, i) => {
        const barHeight = value <= 0 || max <= 0 ? EMPTY_BAR : Math.max(EMPTY_BAR, Math.round((value / max) * barMax));
        // A highlighted bar is always green, even when empty.
        const colour = i === highlight ? 'var(--green)' : value <= 0 ? 'var(--border)' : 'var(--bar)';
        return (
          <div key={i} className={styles.column} style={{ height }}>
            <div className={styles.bar} style={{ height: barHeight, background: colour }} />
            <div className={styles.label}>{labels[i]}</div>
          </div>
        );
      })}
    </div>
  );
}
