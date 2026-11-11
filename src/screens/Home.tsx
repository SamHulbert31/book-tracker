import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Book } from '../db/types';
import { useBooks, useQuotes, useSessions } from '../db/hooks';
import { AddButton, ScreenHeader, SettingsLink } from '../components/ScreenHeader';
import { SyncDot } from '../components/SyncDot';
import { Screen } from '../components/Screen';
import { Card, CardHeading, Eyebrow, CardTitle } from '../components/Card';
import { Tile } from '../components/Tile';
import { BarChart } from '../components/BarChart';
import { ReadingCard } from '../components/ReadingCard';
import { QuoteCard } from '../components/QuoteCard';
import { LogSessionSheet } from '../sheets/LogSessionSheet';
import { Button } from '../components/Button';
import { READER_NAME } from '../lib/config';
import { MONTH_LETTERS, formatNumber, greeting, longDate } from '../lib/dates';
import { booksByMonth, dayStreak, finishedIn, pageEvents, pagesIn } from '../lib/stats';
import styles from './Home.module.css';

export function Home() {
  const navigate = useNavigate();
  const books = useBooks();
  const sessions = useSessions();
  const quotes = useQuotes();
  const [logging, setLogging] = useState<Book | null>(null);
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

  const quoteItems = useMemo(() => {
    const byId = new Map((books ?? []).map((b) => [b.id, b]));
    return (quotes ?? []).flatMap((quote) => {
      const book = byId.get(quote.bookId);
      return book ? [{ quote, book }] : [];
    });
  }, [books, quotes]);

  return (
    <Screen gap={16}>
      <ScreenHeader
        eyebrow={
          <>
            {longDate(now)}
            <SyncDot />
          </>
        }
        title={`${greeting(now)}, ${READER_NAME}`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <SettingsLink />
            <AddButton onClick={() => navigate('/add')} />
          </div>
        }
      />

      {/* A random quote once any exist; until then, a gentle prompt. */}
      {quoteItems.length > 0 ? (
        <QuoteCard items={quoteItems} />
      ) : (
        <Card tone="green" padding={20}>
          <Eyebrow tone="gold">From your quotes</Eyebrow>
          <p className={styles.quotePrompt}>Save a favourite line from any book and it will turn up here.</p>
        </Card>
      )}

      {data &&
        (data.reading.length > 0 ? (
          <ReadingCard books={data.reading} onLog={setLogging} />
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
      {logging && (
        <LogSessionSheet
          book={logging}
          onClose={() => setLogging(null)}
          onStartTimer={() => navigate(`/session/${logging.id}`)}
          onSaved={(finished) => {
            const id = logging.id;
            setLogging(null);
            if (finished) navigate(`/book/${id}`, { state: { finish: true } });
          }}
        />
      )}
    </Screen>
  );
}
