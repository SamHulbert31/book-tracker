import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import type { Quote, Session } from '../db/types';
import { useBook, useBookQuotes, useBookSessions } from '../db/hooks';
import { deleteBook, moveToTbr, startReading, updateBook } from '../db/repo';
import { Screen } from '../components/Screen';
import { EmptyState } from '../components/EmptyState';
import { BackLink } from '../components/BackLink';
import { Button } from '../components/Button';
import { Card, CardHeading, CardTitle } from '../components/Card';
import { Cover } from '../components/Cover';
import { GenreChips } from '../components/Chips';
import { StarInput } from '../components/Stars';
import { Tile } from '../components/Tile';
import { BookEditorSheet } from '../sheets/BookEditorSheet';
import { FinishSheet } from '../sheets/FinishSheet';
import { DateSheet } from '../sheets/DateSheet';
import { ReviewSheet } from '../sheets/ReviewSheet';
import { ConfirmSheet } from '../sheets/ConfirmSheet';
import { SessionSheet } from '../sheets/SessionSheet';
import { QuoteSheet } from '../sheets/QuoteSheet';
import { readTimer } from '../lib/timer';
import { quoteMeta } from '../lib/quotes';
import { daysBetween, formatDate, formatDays, formatDuration, todayISO } from '../lib/dates';
import styles from './BookDetail.module.css';

type SheetName = 'edit' | 'finish' | 'started' | 'finished' | 'review' | 'delete';

export function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const book = useBook(id);
  const sessions = useBookSessions(id);
  const quotes = useBookQuotes(id);
  // Arriving from a session that reached the last page opens the finish sheet straight away.
  const [sheet, setSheet] = useState<SheetName | null>((location.state as { finish?: boolean } | null)?.finish ? 'finish' : null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [quoteSheet, setQuoteSheet] = useState<{ quote?: Quote } | null>(null);
  const [showAllSessions, setShowAllSessions] = useState(false);
  // The rating shown while the stars are being dragged, before it is saved.
  const [draftRating, setDraftRating] = useState<number>();

  if (book === undefined) return <Screen gap={14} compactTop>{null}</Screen>;

  if (book === null) {
    return (
      <Screen gap={14} compactTop>
        <BackLink to="/library">Library</BackLink>
        <EmptyState title="Book not found">It may have been removed. Head back to your library to pick another.</EmptyState>
      </Screen>
    );
  }

  const close = () => setSheet(null);

  const orderedSessions = [...(sessions ?? [])].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const shownSessions = showAllSessions ? orderedSessions : orderedSessions.slice(0, 3);
  const totalSeconds = orderedSessions.reduce((sum, x) => sum + x.durationSec, 0);
  const latestQuote = [...(quotes ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const timerHere = readTimer()?.bookId === book.id;
  const rating = draftRating ?? book.rating;
  const meta = [book.author || undefined, book.year, book.pages ? `${book.pages} pages` : undefined].filter(Boolean).join(' · ');
  const timeLabel = book.status === 'reading' ? 'Reading for' : 'Time taken';
  const timeValue =
    book.startedAt && book.status === 'read' && book.finishedAt
      ? formatDays(daysBetween(book.startedAt, book.finishedAt))
      : book.startedAt && book.status === 'reading'
        ? formatDays(daysBetween(book.startedAt, todayISO()))
        : '–';

  return (
    <Screen gap={14} compactTop>
      <div className={styles.topBar}>
        <BackLink to="/library">Library</BackLink>
        <button type="button" className={styles.edit} onClick={() => setSheet('edit')}>
          Edit
        </button>
      </div>

      <div className={styles.hero}>
        <Cover title={book.title} coverUrl={book.coverUrl} size="lg" />
        <div className={styles.heroText}>
          <h1 className={styles.title}>{book.title}</h1>
          {meta && <div className={styles.meta}>{meta}</div>}
          <GenreChips genres={book.genres} />
          {book.status === 'read' && (
            <div className={styles.rating}>
              <StarInput
                value={rating}
                size={26}
                label="Your rating"
                onChange={setDraftRating}
                onCommit={async (value) => {
                  await updateBook(book.id, { rating: value });
                  setDraftRating(undefined);
                }}
              />
              {rating !== undefined && <div className={styles.ratingNumber}>{rating}</div>}
            </div>
          )}
        </div>
      </div>

      {book.status !== 'tbr' && (
        <div className={styles.tiles}>
          <DateTile label="Started" value={formatDate(book.startedAt)} onClick={() => setSheet('started')} />
          {book.status === 'read' ? (
            <DateTile label="Finished" value={formatDate(book.finishedAt)} onClick={() => setSheet('finished')} />
          ) : (
            <Tile compact value={book.pages ? `${book.currentPage ?? 0} / ${book.pages}` : `p. ${book.currentPage ?? 0}`} label="Page" />
          )}
          <Tile compact value={timeValue} label={timeLabel} />
        </div>
      )}

      {book.status === 'read' && (
        <button type="button" className={styles.cardButton} onClick={() => setSheet('review')} aria-label="Edit review">
          <Card gap={6}>
            <CardTitle>My review</CardTitle>
            {book.review ? <p className={styles.review}>{book.review}</p> : <p className={styles.reviewEmpty}>Tap to write a review.</p>}
          </Card>
        </button>
      )}

      {book.status !== 'tbr' && (
        <Card gap={10}>
          <CardHeading
            title="Reading sessions"
            aside={totalSeconds > 0 ? `${formatDuration(totalSeconds)} total` : undefined}
          />
          {orderedSessions.length === 0 && <p className={styles.reviewEmpty}>No sessions yet.</p>}
          <div className={styles.sessionList}>
          {shownSessions.map((s) => (
            <button key={s.id} type="button" className={styles.sessionRow} onClick={() => setEditingSession(s)} aria-label={`Edit session on ${formatDate(s.date)}`}>
              <span>
                {formatDate(s.date)}
                {s.startPage !== undefined && s.endPage !== undefined ? ` · pages ${s.startPage} to ${s.endPage}` : ''}
              </span>
              <strong>{s.durationSec > 0 ? formatDuration(s.durationSec) : '–'}</strong>
            </button>
          ))}
          </div>
          {orderedSessions.length > 3 && (
            <Button variant="quiet" onClick={() => setShowAllSessions((v) => !v)}>
              {showAllSessions ? 'Show fewer' : `Show all ${orderedSessions.length}`}
            </Button>
          )}
          <Button variant="outline" block onClick={() => navigate(`/session/${book.id}`)}>
            {timerHere ? 'Resume timed session' : 'Start a timed session'}
          </Button>
        </Card>
      )}

      <Card tone="green" gap={10}>
        <div className={styles.quotesHead}>
          <CardTitle>Quotes · {quotes?.length ?? 0}</CardTitle>
          <button type="button" className={styles.addQuote} onClick={() => setQuoteSheet({})}>
            Add quote
          </button>
        </div>
        {latestQuote ? (
          <button type="button" className={styles.latestQuote} onClick={() => setQuoteSheet({ quote: latestQuote })} aria-label="Edit latest quote">
            <span className={styles.quoteText}>“{latestQuote.text}”</span>
            {quoteMeta(latestQuote) && <span className={styles.quoteMeta}>{quoteMeta(latestQuote)}</span>}
          </button>
        ) : (
          <p className={styles.quoteMeta}>Save a line you want to remember.</p>
        )}
        {(quotes?.length ?? 0) > 0 && (
          <Link to={`/quotes?book=${book.id}`} className={styles.allQuotes}>
            All quotes
          </Link>
        )}
      </Card>

      <div className={styles.actions}>
        {book.status === 'tbr' && (
          <Button block onClick={() => startReading(book.id)}>
            Start reading
          </Button>
        )}
        {book.status === 'reading' && (
          <>
            <Button block onClick={() => setSheet('finish')}>
              Mark as finished
            </Button>
            <Button block variant="outline" onClick={() => moveToTbr(book.id)}>
              Move back to TBR
            </Button>
          </>
        )}
        {book.status === 'read' && (
          <Button block variant="outline" onClick={() => moveToTbr(book.id)}>
            Move back to TBR
          </Button>
        )}
        <Button block variant="danger" onClick={() => setSheet('delete')}>
          Delete book
        </Button>
      </div>

      {sheet === 'edit' && (
        <BookEditorSheet
          title="Edit book"
          saveLabel="Save"
          initial={book}
          onClose={close}
          onSave={async (values) => {
            await updateBook(book.id, values);
            close();
          }}
        />
      )}
      {sheet === 'finish' && <FinishSheet book={book} onClose={close} />}
      {editingSession && <SessionSheet session={editingSession} book={book} onClose={() => setEditingSession(null)} />}
      {quoteSheet && <QuoteSheet quote={quoteSheet.quote} bookId={book.id} onClose={() => setQuoteSheet(null)} />}
      {sheet === 'started' && (
        <DateSheet
          title="Date started"
          label="Started"
          value={book.startedAt}
          max={book.status === 'read' ? book.finishedAt : todayISO()}
          clearable
          onClose={close}
          onSave={async (value) => {
            await updateBook(book.id, { startedAt: value });
            close();
          }}
        />
      )}
      {sheet === 'finished' && (
        <DateSheet
          title="Date finished"
          label="Finished"
          value={book.finishedAt}
          min={book.startedAt}
          max={todayISO()}
          onClose={close}
          onSave={async (value) => {
            await updateBook(book.id, { finishedAt: value });
            close();
          }}
        />
      )}
      {sheet === 'review' && (
        <ReviewSheet
          value={book.review}
          onClose={close}
          onSave={async (value) => {
            await updateBook(book.id, { review: value });
            close();
          }}
        />
      )}
      {sheet === 'delete' && (
        <ConfirmSheet
          title="Delete this book?"
          message={`“${book.title}” and any sessions and quotes saved with it will be removed.`}
          confirmLabel="Delete book"
          danger
          onClose={close}
          onConfirm={async () => {
            await deleteBook(book.id);
            navigate('/library', { replace: true });
          }}
        />
      )}
    </Screen>
  );
}

/** A stat tile that opens a date editor when tapped. */
function DateTile({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button type="button" className={styles.tileButton} onClick={onClick} aria-label={`${label}: ${value}. Tap to change.`}>
      <Tile compact value={value} label={label} />
    </button>
  );
}
