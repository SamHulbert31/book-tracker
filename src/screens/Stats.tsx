import { useState } from 'react';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { Segmented } from '../components/Segmented';
import { Tile } from '../components/Tile';
import { Card, CardHeading, CardTitle } from '../components/Card';
import { BarChart } from '../components/BarChart';
import { MONTH_LETTERS } from '../lib/dates';
import styles from './Stats.module.css';

type Period = 'month' | 'year' | 'all';

export function Stats() {
  const year = new Date().getFullYear();
  const [period, setPeriod] = useState<Period>('year');

  return (
    <Screen gap={14}>
      <ScreenHeader title="Stats" />

      <Segmented<Period>
        label="Period"
        value={period}
        onChange={setPeriod}
        options={[
          { value: 'month', label: 'Month' },
          { value: 'year', label: String(year) },
          { value: 'all', label: 'All time' },
        ]}
      />

      <div className={styles.tiles}>
        <Tile wide value="0" label="books finished" />
        <Tile wide value="0" label="pages read" />
        <Tile wide value="–" label="average rating" />
        <Tile wide value="–" label="average per book" />
      </div>

      <Card>
        <CardHeading title="Pages by month" />
        <BarChart
          values={new Array<number>(12).fill(0)}
          labels={MONTH_LETTERS}
          height={84}
          barMax={66}
          ariaLabel="No pages read yet"
        />
      </Card>

      <Card gap={10}>
        <CardTitle>Genres</CardTitle>
        <p className={styles.note}>Genres will appear here once you have finished a few books.</p>
      </Card>
    </Screen>
  );
}
