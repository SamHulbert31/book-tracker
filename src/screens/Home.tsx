import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooks, useSessions } from '../db/hooks';
import { AddButton, ScreenHeader } from '../components/ScreenHeader';
import { Screen } from '../components/Screen';
import { Card, CardHeading, Eyebrow, CardTitle } from '../components/Card';
import { Tile } from '../components/Tile';
import { BarChart } from '../components/BarChart';
import { ReadingCard } from '../components/ReadingCard';
import { Button } from '../components/Button';
import { READER_NAME } from '../lib/config';
import { MONTH_LETTERS, formatNumber, greeting, longDate } from '../lib/dates';
import { booksByMonth, dayStreak, finishedIn, pageEvents, pagesIn } from '../lib/stats';
import styles from './Home.module.css';

export function Home() {
  const navigate = useNavigate();
  const books = useBooks();
  const sessions = useSessions();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const data = useMemo(() => {
    if (!books || !sessions) return undefined;
    const thisMonth = { kind: 'month', year, month } as const;
    const monthly = booksByMonth(books, year);
    return {
      reading: books.filter((b) => b.status === 'reading').sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? '')),
      booksThisMonth: finishedIn(books, thisMonth).length,
      pagesThisMonth: pagesIn(pageEvents(books, sessions), thisMonth),
      streak: dayStreak(sessions, new Date()),
      monthly,
      finishedThisYear: monthly.reduce((a, b) => a + b, 0),
    };
  }, [books, sessions, year, month]);

  return (
    <Screen gap={16}>
      <ScreenHeader eyebrow={longDate(now)} title={`${greeting(now)}, ${READER_NAME}`} action={<AddButton onClick={() => navigate('/add')} />} />

      {/* Shows a random quote once any exist; until then, a gentle prompt. */}
      <Card tone="green" padding={20}>
        <Eyebrow tone="gold">From your quotes</Eyebrow>
        <p className={styles.quotePrompt}>Save a favourite line from any book and it will turn up here.</p>
      </Card>

      {data &&
        (data.reading.length > 0 ? (
          <ReadingCard books={data.reading} onLog={(book) => navigate(`/book/${book.id}`)} />
        ) : (
          <Card row>
            <div className={styles.ghostCover} aria-hidden="true" />
            <div className={styles.reading}>
              <Eyebrow>Currently reading</Eyebrow>
              <CardTitle>Nothing on the go</CardTitle>
              <p className={styles.caption}>Start a book and your progress will show up here.</p>
              <div className={styles.cta}>
                <Button variant="outline" onClick={() => navigate('/library')}>
                  Open library
                </Button>
              </div>
            </div>
          </Card>
        ))}

      <div className={styles.tiles}>
        <Tile value={data ? String(data.booksThisMonth) : '–'} label="books this month" />
        <Tile value={data ? formatNumber(data.pagesThisMonth) : '–'} label="pages this month" />
        <Tile value={data ? String(data.streak) : '–'} label="day streak" />
      </div>

      <Card>
        <CardHeading title={`Books finished in ${year}`} aside={`${data?.finishedThisYear ?? 0} so far`} />
        <BarChart
          values={data?.monthly ?? new Array<number>(12).fill(0)}
          labels={MONTH_LETTERS}
          highlight={month}
          height={72}
          barMax={56}
          scaleMax={Math.max(4, ...(data?.monthly ?? []))}
          ariaLabel={`Books finished each month of ${year}`}
        />
      </Card>
    </Screen>
  );
}
