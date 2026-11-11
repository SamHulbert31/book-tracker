import { AddButton, ScreenHeader } from '../components/ScreenHeader';
import { Screen } from '../components/Screen';
import { Card, CardHeading, CardTitle, Eyebrow } from '../components/Card';
import { Tile } from '../components/Tile';
import { BarChart } from '../components/BarChart';
import { READER_NAME } from '../lib/config';
import { MONTH_LETTERS, greeting, longDate } from '../lib/dates';
import styles from './Home.module.css';

export function Home() {
  const now = new Date();
  const year = now.getFullYear();

  return (
    <Screen gap={16}>
      <ScreenHeader eyebrow={longDate(now)} title={`${greeting(now)}, ${READER_NAME}`} action={<AddButton />} />

      {/* Shows a random quote once any exist; until then, a gentle prompt. */}
      <Card tone="green" padding={20}>
        <Eyebrow tone="gold">From your quotes</Eyebrow>
        <p className={styles.quotePrompt}>Save a favourite line from any book and it will turn up here.</p>
      </Card>

      <Card row>
        <div className={styles.ghostCover} aria-hidden="true" />
        <div className={styles.reading}>
          <Eyebrow>Currently reading</Eyebrow>
          <CardTitle>Nothing on the go</CardTitle>
          <p className={styles.caption}>Start a book and your progress will show up here.</p>
        </div>
      </Card>

      <div className={styles.tiles}>
        <Tile value="0" label="books this month" />
        <Tile value="0" label="pages this month" />
        <Tile value="0" label="day streak" />
      </div>

      <Card>
        <CardHeading title={`Books finished in ${year}`} aside="0 so far" />
        <BarChart
          values={new Array<number>(12).fill(0)}
          labels={MONTH_LETTERS}
          highlight={now.getMonth()}
          height={72}
          barMax={56}
          scaleMax={4}
          ariaLabel={`No books finished in ${year} yet`}
        />
      </Card>
    </Screen>
  );
}
