import { useState } from 'react';
import type { Book, Status } from '../db/types';
import type { NewBook } from '../db/repo';
import { Sheet } from '../components/Sheet';
import { Button } from '../components/Button';
import { Field, FieldGroup, FieldRow, FormError, Input, Textarea } from '../components/Field';
import { ChipPicker } from '../components/Chips';
import { Segmented } from '../components/Segmented';
import { StarInput } from '../components/Stars';
import { GENRES } from '../lib/genres';
import { todayISO } from '../lib/dates';

interface BookEditorSheetProps {
  title: string;
  saveLabel: string;
  /** Starting values. For a new book this is the search result, or empty for manual entry. */
  initial: Partial<Book>;
  onSave: (values: NewBook) => void | Promise<void>;
  onClose: () => void;
}

/** Parses an optional whole number field. Returns `null` when the text is not a valid number. */
function parseWhole(text: string, min: number, max: number): number | undefined | null {
  const t = text.trim();
  if (t === '') return undefined;
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return n >= min && n <= max ? n : null;
}

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'tbr', label: 'TBR' },
  { value: 'reading', label: 'Reading' },
  { value: 'read', label: 'Read' },
];

/** One form for adding a book and editing it: details, genres, status, dates, rating and review. */
export function BookEditorSheet({ title, saveLabel, initial, onSave, onClose }: BookEditorSheetProps) {
  const today = todayISO();
  const [name, setName] = useState(initial.title ?? '');
  const [author, setAuthor] = useState(initial.author ?? '');
  const [year, setYear] = useState(initial.year ? String(initial.year) : '');
  const [pages, setPages] = useState(initial.pages ? String(initial.pages) : '');
  const [genres, setGenres] = useState<string[]>(initial.genres ?? []);
  const [status, setStatus] = useState<Status>(initial.status ?? 'tbr');
  const [startedAt, setStartedAt] = useState(initial.startedAt ?? '');
  const [finishedAt, setFinishedAt] = useState(initial.finishedAt ?? '');
  const [currentPage, setCurrentPage] = useState(initial.currentPage !== undefined ? String(initial.currentPage) : '');
  const [rating, setRating] = useState<number | undefined>(initial.rating);
  const [review, setReview] = useState(initial.review ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Genres the book already has but that are not in the fixed list stay visible and removable.
  const genreOptions = [...GENRES, ...genres.filter((g) => !(GENRES as readonly string[]).includes(g))];

  function changeStatus(next: Status) {
    setStatus(next);
    if (next === 'reading' && !startedAt) setStartedAt(today);
    if (next === 'read' && !finishedAt) setFinishedAt(today);
  }

  function toggleGenre(genre: string) {
    setGenres((current) => (current.includes(genre) ? current.filter((g) => g !== genre) : [...current, genre]));
  }

  async function save() {
    if (!name.trim()) return setError('Add a title.');
    const parsedYear = parseWhole(year, 1000, new Date().getFullYear() + 1);
    if (parsedYear === null) return setError('Year should be a four digit year.');
    const parsedPages = parseWhole(pages, 1, 99999);
    if (parsedPages === null) return setError('Pages should be a whole number above zero.');
    const parsedCurrent = parseWhole(currentPage, 0, parsedPages ?? 99999);
    if (parsedCurrent === null) return setError('Current page should be a whole number, and no higher than the page count.');
    if (status === 'read' && !finishedAt) return setError('Pick the date you finished.');
    if (status !== 'tbr' && startedAt && finishedAt && status === 'read' && finishedAt < startedAt) {
      return setError('The finish date cannot be before the start date.');
    }

    const values: NewBook = {
      title: name.trim(),
      author: author.trim(),
      year: parsedYear,
      pages: parsedPages,
      genres,
      status,
    };
    if (status === 'tbr') {
      Object.assign(values, { startedAt: undefined, finishedAt: undefined, currentPage: undefined });
    } else if (status === 'reading') {
      Object.assign(values, { startedAt: startedAt || undefined, finishedAt: undefined, currentPage: parsedCurrent ?? 0 });
    } else {
      Object.assign(values, {
        startedAt: startedAt || undefined,
        finishedAt,
        rating,
        review: review.trim() || undefined,
        currentPage: parsedPages ?? parsedCurrent,
      });
    }
    setError('');
    setSaving(true);
    try {
      await onSave(values);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      title={title}
      onClose={onClose}
      footer={
        <>
          {error && <FormError>{error}</FormError>}
          <Button block onClick={save} disabled={saving}>
            {saveLabel}
          </Button>
        </>
      }
    >
      <Field label="Title">
        <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
      </Field>
      <Field label="Author">
        <Input value={author} onChange={(e) => setAuthor(e.target.value)} autoComplete="off" />
      </Field>
      <FieldRow>
        <Field label="Year">
          <Input value={year} onChange={(e) => setYear(e.target.value)} inputMode="numeric" placeholder="1965" />
        </Field>
        <Field label="Pages">
          <Input value={pages} onChange={(e) => setPages(e.target.value)} inputMode="numeric" placeholder="412" />
        </Field>
      </FieldRow>
      <FieldGroup label="Genres">
        <ChipPicker options={genreOptions} selected={genres} onToggle={toggleGenre} />
      </FieldGroup>

      <FieldGroup label="Status">
        <Segmented<Status> label="Status" options={STATUS_OPTIONS} value={status} onChange={changeStatus} />
      </FieldGroup>

      {status === 'reading' && (
        <FieldRow>
          <Field label="Started">
            <Input type="date" value={startedAt} max={today} onChange={(e) => setStartedAt(e.target.value)} />
          </Field>
          <Field label="Current page">
            <Input value={currentPage} onChange={(e) => setCurrentPage(e.target.value)} inputMode="numeric" placeholder="0" />
          </Field>
        </FieldRow>
      )}

      {status === 'read' && (
        <>
          <FieldRow>
            <Field label="Started (optional)">
              <Input type="date" value={startedAt} max={today} onChange={(e) => setStartedAt(e.target.value)} />
            </Field>
            <Field label="Finished">
              <Input type="date" value={finishedAt} max={today} onChange={(e) => setFinishedAt(e.target.value)} />
            </Field>
          </FieldRow>
          <FieldGroup
            label="Rating"
            action={
              rating !== undefined && (
                <Button variant="quiet" style={{ minHeight: 44, minWidth: 44, padding: 0, fontSize: 12 }} onClick={() => setRating(undefined)}>
                  Clear
                </Button>
              )
            }
          >
            <StarInput value={rating} onChange={setRating} />
          </FieldGroup>
          <Field label="Review">
            <Textarea value={review} onChange={(e) => setReview(e.target.value)} />
          </Field>
        </>
      )}
    </Sheet>
  );
}
