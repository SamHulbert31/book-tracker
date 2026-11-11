import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBooks, useSessions } from '../db/hooks';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { Segmented } from '../components/Segmented';
import { Tile } from '../components/Tile';
import { Card, CardHeading, CardTitle } from '../components/Card';
import { BarChart } from '../components/BarChart';
import { ChevronLeftIcon } from '../components/Icons';
import { EnjoyingCard } from '../components/EnjoyingCard';
import { YearSheet } from '../sheets/YearSheet';
import { MONTH_LETTERS, formatDate, formatDuration, formatNumber } from '../lib/dates';
import {
  MONTH_NAMES,
  averageDays,
  averageRating,
  finishedIn,
  genreCounts,
  inPeriod,
  longestAndShortest,
  monthLabel,
  oneDecimal,
  pageEvents,
  pagesByDay,
  pagesByMonth,
  pagesByYear,
  pagesIn,
  ratingDistribution,
  readingSeconds,
  topAuthors,
  yearsWithData,
  type Period,
} from '../lib/stats';
import styles from './Stats.module.css';

type Mode = 'month' | 'year' | 'all';

const GENRE_COLOURS = ['#26432F', '#7C2F2B', '#8A6D1F', '#2F4A66', '#6B5D4D'];
const OTHER_COLOUR = '#B8A27A';
const RATING_LABELS = ['0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5'];

export function Stats() {
  const books = useBooks();
  const sessions = useSessions();
  const today = new Date();
  const thisYear = today.getFullYear();
  const thisMonth = today.getMonth();

  const [mode, setMode] = useState<Mode>('year');
  const [year, setYear] = useState(thisYear);
  const [cursor, setCursor] = useState({ year: thisYear, month: thisMonth });
  const [pickYear, setPickYear] = useState(false);

  const period: Period = mode === 'all' ? { kind: 'all' } : mode === 'year' ? { kind: 'year', year } : { kind: 'month', ...cursor };

  const years = useMemo(() => yearsWithData(books ?? [], sessions ?? [], thisYear), [books, sessions, thisYear]);

  const stats = useMemo(() => {
    if (!books || !sessions) return undefined;
    const events = pageEvents(books, sessions);
    const finished = finishedIn(books, period);
    const rating = averageRating(finished);
    const days = averageDays(finished);

    // The chart: days of a month, months of a year, or years.
    let chart: { values: number[]; labels: string[]; title: string; highlight?: number; best?: string; gap: number };
    if (period.kind === 'month') {
      const values = pagesByDay(events, period.year, period.month);
      const peak = Math.max(...values);
      chart = {
        values,
        labels: values.map((_, i) => ((i + 1) % 7 === 1 ? String(i + 1) : '')),
        title: 'Pages by day',
        best: peak > 0 ? `best: ${values.indexOf(peak) + 1} ${MONTH_NAMES[period.month]}` : undefined,
        highlight: undefined,
        gap: 2,
      };
    } else if (period.kind === 'year') {
      const values = pagesByMonth(events, period.year);
      const peak = Math.max(...values);
      chart = { values, labels: MONTH_LETTERS, title: 'Pages by month', best: peak > 0 ? `best: ${MONTH_NAMES[values.indexOf(peak)]}` : undefined, highlight: peak > 0 ? values.indexOf(peak) : undefined, gap: 6 };
    } else {
      const { years: ys, pages } = pagesByYear(events, thisYear);
      const peak = Math.max(...pages);
      chart = { values: pages, labels: ys.map((y) => `’${String(y).slice(2)}`), title: 'Pages by year', best: peak > 0 ? `best: ${ys[pages.indexOf(peak)]}` : undefined, highlight: peak > 0 ? pages.indexOf(peak) : undefined, gap: 6 };
    }

    return {
      finished,
      pages: pagesIn(events, period),
      rating,
      days,
      chart,
      genres: genreCounts(finished),
      distribution: ratingDistribution(finished),
      extremes: longestAndShortest(finished),
      authors: topAuthors(finished),
      seconds: readingSeconds(sessions, period),
      sessionCount: sessions.filter((s) => inPeriod(s.date, period)).length,
    };
    // `period` is rebuilt every render from `mode`, `year` and `cursor`, so those are the real dependencies.
  }, [books, sessions, mode, year, cursor, thisYear]);

  const atCurrentMonth = cursor.year === thisYear && cursor.month === thisMonth;
  function stepMonth(delta: number) {
    const d = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  }

  function onMode(next: Mode) {
    // Tapping the year segment again lets you pick another year.
    if (next === 'year' && mode === 'year' && years.length > 1) return setPickYear(true);
    setMode(next);
  }

  const maxGenre = Math.max(1, ...(stats?.genres.map((g) => g.count) ?? [1]));
  const maxRating = Math.max(1, ...(stats?.distribution ?? [1]));

  return (
    <Screen gap={14}>
      <ScreenHeader title="Stats" />

      <Segmented<Mode>
        label="Period"
        value={mode}
        onChange={onMode}
        options={[
          { value: 'month', label: 'Month' },
          { value: 'year', label: years.length > 1 && mode === 'year' ? `${year} ▾` : String(year) },
          { value: 'all', label: 'All time' },
        ]}
      />

      {mode === 'month' && (
        <div className={styles.monthNav}>
          <button type="button" className={styles.step} aria-label="Previous month" onClick={() => stepMonth(-1)}>
            <ChevronLeftIcon />
          </button>
          <div className={styles.monthName} aria-live="polite">
            {monthLabel(cursor.year, cursor.month)}
          </div>
          <button type="button" className={`${styles.step} ${styles.next}`} aria-label="Next month" disabled={atCurrentMonth} onClick={() => stepMonth(1)}>
            <ChevronLeftIcon />
          </button>
        </div>
      )}

      <div className={styles.tiles}>
        <Tile wide value={stats ? String(stats.finished.length) : '–'} label="books finished" />
        <Tile wide value={stats ? formatNumber(stats.pages) : '–'} label="pages read" />
        <Tile wide value={stats?.rating !== undefined ? oneDecimal(stats.rating) : '–'} label="average rating" />
        <Tile wide value={stats?.days !== undefined ? `${Math.round(stats.days)} ${Math.round(stats.days) === 1 ? 'day' : 'days'}` : '–'} label="average per book" />
      </div>

      {stats && (
        <>
          <Card>
            <CardHeading title={stats.chart.title} aside={stats.chart.best} />
            <BarChart
              values={stats.chart.values}
              labels={stats.chart.labels}
              highlight={stats.chart.highlight}
              height={84}
              barMax={66}
              gap={stats.chart.gap}
              ariaLabel={`${stats.chart.title}${stats.chart.best ? `, ${stats.chart.best}` : ''}`}
            />
          </Card>

          <Card gap={10}>
            <CardTitle>Genres</CardTitle>
            {stats.genres.length === 0 ? (
              <p className={styles.note}>Genres will appear here once you finish a few books.</p>
            ) : (
              stats.genres.map((g, i) => (
                <div key={g.name} className={styles.genreRow}>
                  <div className={styles.genreName}>{g.name}</div>
                  <div className={styles.track}>
                    <div
                      className={styles.fill}
                      style={{ width: `${Math.round((g.count / maxGenre) * 100)}%`, background: g.name === 'Other' ? OTHER_COLOUR : GENRE_COLOURS[i % GENRE_COLOURS.length] }}
                    />
                  </div>
                  <div className={styles.genreCount}>{g.count}</div>
                </div>
              ))
            )}
          </Card>

          {stats.finished.length > 0 && (
            <>
              {stats.distribution.some((n) => n > 0) && (
                <Card>
                  <CardHeading title="Ratings" aside={stats.rating !== undefined ? `average ${oneDecimal(stats.rating)}` : undefined} />
                  <BarChart values={stats.distribution} labels={RATING_LABELS} height={72} barMax={52} scaleMax={maxRating} gap={4} ariaLabel="How many books got each rating" />
                </Card>
              )}

              {stats.extremes && (
                <Card gap={10}>
                  <CardTitle>Longest and shortest</CardTitle>
                  <BookLine label="Longest" book={stats.extremes.longest} />
                  {stats.extremes.shortest.id !== stats.extremes.longest.id && <BookLine label="Shortest" book={stats.extremes.shortest} />}
                </Card>
              )}

              {stats.authors.length > 0 && (
                <Card gap={10}>
                  <CardTitle>Most read authors</CardTitle>
                  {stats.authors.map((a) => (
                    <div key={a.name} className={styles.line}>
                      <div className={styles.lineMain}>{a.name}</div>
                      <div className={styles.lineEnd}>{a.count === 1 ? '1 book' : `${a.count} books`}</div>
                    </div>
                  ))}
                </Card>
              )}
            </>
          )}

          {stats.seconds > 0 && (
            <Card gap={6}>
              <CardHeading title="Time reading" aside={`${stats.sessionCount} ${stats.sessionCount === 1 ? 'session' : 'sessions'}`} />
              <div className={styles.bigNumber}>{formatDuration(stats.seconds)}</div>
            </Card>
          )}
        </>
      )}

      {books && <EnjoyingCard books={books} />}

      {pickYear && (
        <YearSheet
          years={years}
          value={year}
          onClose={() => setPickYear(false)}
          onPick={(y) => {
            setYear(y);
            setPickYear(false);
          }}
        />
      )}
    </Screen>
  );
}

function BookLine({ label, book }: { label: string; book: { id: string; title: string; author: string; pages?: number; finishedAt?: string } }) {
  return (
    <div className={styles.line}>
      <div className={styles.lineMain}>
        <div className={styles.lineLabel}>{label}</div>
        <Link to={`/book/${book.id}`} className={styles.bookLink}>
          {book.title}
        </Link>
        <div className={styles.lineSub}>{[book.author || undefined, book.finishedAt ? formatDate(book.finishedAt) : undefined].filter(Boolean).join(' · ')}</div>
      </div>
      <div className={styles.lineEnd}>{book.pages ? `${formatNumber(book.pages)} pages` : ''}</div>
    </div>
  );
}
