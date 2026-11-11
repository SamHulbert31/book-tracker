import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Book } from '../db/types';
import { useBook } from '../db/hooks';
import { addSession, updateBook } from '../db/repo';
import { Screen } from '../components/Screen';
import { BackLink } from '../components/BackLink';
import { Button } from '../components/Button';
import { Card, Eyebrow } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Field, FieldRow, FormError, Input } from '../components/Field';
import { formatDuration, todayISO } from '../lib/dates';
import { elapsedMs, formatClock, readTimer, writeTimer, type TimerState } from '../lib/timer';
import styles from './Session.module.css';

/** Keeps the screen awake while the timer runs, where the browser allows it. */
function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let sentinel: WakeLockSentinel | undefined;
    let cancelled = false;
    const acquire = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) void lock.release();
        else sentinel = lock;
      } catch {
        // Denied or unsupported: the timer still keeps correct time.
      }
    };
    void acquire();
    // The lock is dropped when the page is hidden, so ask again on return.
    const onVisible = () => document.visibilityState === 'visible' && void acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void sentinel?.release();
    };
  }, [active]);
}

export function Session() {
  const { id } = useParams();
  const navigate = useNavigate();
  const book = useBook(id);
  const [timer, setTimerState] = useState<TimerState | null>(readTimer);
  const [now, setNow] = useState(() => Date.now());

  const running = timer?.startedAtMs !== undefined;
  const mine = timer && timer.bookId === id ? timer : null;
  const elsewhere = timer && timer.bookId !== id ? timer : null;
  const otherBook = useBook(elsewhere?.bookId);

  useWakeLock(running && Boolean(mine));

  // Re-render a few times a second while running. The value shown comes from timestamps.
  useEffect(() => {
    if (!running) return;
    const tick = () => setNow(Date.now());
    const interval = window.setInterval(tick, 250);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [running]);

  function set(next: TimerState | null) {
    writeTimer(next);
    setTimerState(next);
    setNow(Date.now());
  }

  if (book === undefined) return <Screen gap={16} compactTop>{null}</Screen>;
  if (book === null || !id) {
    return (
      <Screen gap={16} compactTop>
        <BackLink to="/library">Library</BackLink>
        <EmptyState title="Book not found">Pick a book from your library to start a session.</EmptyState>
      </Screen>
    );
  }

  const ms = mine ? elapsedMs(mine, now) : 0;
  const state = !mine ? 'Ready' : mine.stopped ? 'Stopped' : running ? 'Running' : 'Paused';

  return (
    <Screen gap={16} compactTop>
      <BackLink to={`/book/${id}`}>{book.title}</BackLink>

      <div>
        <div className={styles.eyebrow}>Reading session</div>
        <h1 className={styles.title}>{book.title}</h1>
      </div>

      {elsewhere ? (
        <Card gap={10}>
          <p className={styles.notice}>
            A timer is already {elsewhere.stopped ? 'waiting to be saved' : 'going'} for <strong>{otherBook?.title ?? 'another book'}</strong> ({formatClock(elapsedMs(elsewhere, now))}).
          </p>
          <Button block onClick={() => navigate(`/session/${elsewhere.bookId}`)}>
            Go to that timer
          </Button>
          <Button block variant="danger" onClick={() => set(null)}>
            Discard it and start here
          </Button>
        </Card>
      ) : (
        <>
          <Card tone="green" padding={20} gap={6}>
            <Eyebrow tone="gold">{state}</Eyebrow>
            <div className={styles.clock} role="timer" aria-live="off" aria-label={`Elapsed ${formatClock(ms)}`}>
              {formatClock(ms)}
            </div>
          </Card>

          {!mine && (
            <Button
              block
              className={styles.big}
              onClick={() => set({ bookId: id, date: todayISO(), accumulatedMs: 0, startedAtMs: Date.now(), stopped: false })}
            >
              Start
            </Button>
          )}

          {mine && !mine.stopped && (
            <div className={styles.controls}>
              {running ? (
                <Button variant="outline" className={styles.big} onClick={() => set({ ...mine, accumulatedMs: elapsedMs(mine), startedAtMs: undefined })}>
                  Pause
                </Button>
              ) : (
                <Button variant="outline" className={styles.big} onClick={() => set({ ...mine, startedAtMs: Date.now() })}>
                  Resume
                </Button>
              )}
              <Button className={styles.big} onClick={() => set({ ...mine, accumulatedMs: elapsedMs(mine), startedAtMs: undefined, stopped: true })}>
                Stop
              </Button>
            </div>
          )}

          {mine?.stopped && <PageEntry book={book} timer={mine} onDiscard={() => { set(null); navigate(`/book/${id}`, { replace: true }); }} />}
        </>
      )}
    </Screen>
  );
}

/** After Stop: the page range for the session. */
function PageEntry({ book, timer, onDiscard }: { book: Book; timer: TimerState; onDiscard: () => void }) {
  const navigate = useNavigate();
  const [start, setStart] = useState(String(book.currentPage ?? 0));
  const [end, setEnd] = useState('');
  const [error, setError] = useState('');
  const seconds = Math.round(elapsedMs(timer) / 1000);

  async function save() {
    const s = start.trim();
    const e = end.trim();
    if ((s === '') !== (e === '')) return setError('Fill in both pages, or clear both to save the time only.');
    if ((s && !/^\d+$/.test(s)) || (e && !/^\d+$/.test(e))) return setError('Pages should be whole numbers.');
    if (s && Number(e) < Number(s)) return setError('The end page cannot be before the start page.');
    if (e && book.pages && Number(e) > book.pages) return setError(`${book.title} has ${book.pages} pages.`);

    await addSession({
      bookId: book.id,
      date: timer.date,
      startPage: s ? Number(s) : undefined,
      endPage: e ? Number(e) : undefined,
      durationSec: seconds,
    });
    if (e && book.status === 'reading') await updateBook(book.id, { currentPage: Number(e) });
    writeTimer(null);
    // Reaching the last page offers to mark the book finished.
    const finished = Boolean(e) && Boolean(book.pages) && Number(e) >= (book.pages ?? Infinity) && book.status === 'reading';
    navigate(`/book/${book.id}`, { replace: true, state: finished ? { finish: true } : undefined });
  }

  return (
    <Card gap={12}>
      <div className={styles.summary}>
        <span>Time</span>
        <strong>{formatDuration(seconds)}</strong>
      </div>
      <FieldRow>
        <Field label="From page">
          <Input value={start} onChange={(e) => setStart(e.target.value)} inputMode="numeric" />
        </Field>
        <Field label="To page">
          <Input value={end} onChange={(e) => setEnd(e.target.value)} inputMode="numeric" placeholder={book.pages ? `of ${book.pages}` : ''} />
        </Field>
      </FieldRow>
      {error && <FormError>{error}</FormError>}
      <Button block onClick={save}>
        Save session
      </Button>
      <Button block variant="danger" onClick={onDiscard}>
        Discard
      </Button>
    </Card>
  );
}
