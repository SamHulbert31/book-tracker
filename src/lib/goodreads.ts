import type { NewBook } from '../db/repo';

// Goodreads library export (CSV) to this app's books. Kept free of app imports so it can be tested alone.

export type ImportBook = NewBook & { createdAt?: string };

/** Minimal CSV reader: quoted fields, "" escapes, commas and line breaks inside quotes, optional BOM. */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((f) => f !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f !== '')) rows.push(row);
  return rows;
}

/** Rows as objects keyed by the header names. Throws if this is not a Goodreads export. */
export function readGoodreadsRows(text: string): Record<string, string>[] {
  const [header, ...rest] = parseCsv(text);
  if (!header || !header.includes('Title') || !header.includes('Exclusive Shelf')) {
    throw new Error('That does not look like a Goodreads export. Use the CSV from Goodreads > My Books > Import and export.');
  }
  return rest.map((cells) => Object.fromEntries(header.map((name, i) => [name, (cells[i] ?? '').trim()])));
}

/** Goodreads writes ISBNs as ="978..." so spreadsheets keep the digits. */
const cleanIsbn = (value: string | undefined) => (value ?? '').replace(/^="?/, '').replace(/"$/, '').replace(/[^0-9Xx]/g, '') || undefined;

/** "2021/03/14" to "2021-03-14". */
function cleanDate(value: string | undefined): string | undefined {
  const m = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/.exec((value ?? '').trim());
  return m ? `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` : undefined;
}

const positiveInt = (value: string | undefined) => {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

/** Reviews come with <br/> tags; turn them back into line breaks and drop any other markup. */
const cleanReview = (value: string | undefined) =>
  (value ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim() || undefined;

/** One export row to a book, or null when it has no title. */
export function mapGoodreadsRow(row: Record<string, string>): ImportBook | null {
  const title = (row['Title'] ?? '').trim();
  if (!title) return null;

  const shelf = (row['Exclusive Shelf'] ?? '').trim().toLowerCase();
  const dateRead = cleanDate(row['Date Read']);
  const status = shelf === 'read' ? 'read' : shelf === 'currently-reading' ? 'reading' : shelf === 'to-read' ? 'tbr' : dateRead ? 'read' : 'tbr';
  const rating = positiveInt(row['My Rating']); // 0 means unrated
  const added = cleanDate(row['Date Added']);

  const book: ImportBook = {
    title,
    author: (row['Author'] ?? '').trim(),
    genres: [],
    status,
    year: positiveInt(row['Year Published']),
    pages: positiveInt(row['Number of Pages']),
    isbn: cleanIsbn(row['ISBN13']) ?? cleanIsbn(row['ISBN']),
    rating: rating && rating <= 5 ? rating : undefined,
    review: cleanReview(row['My Review']),
    createdAt: added ? `${added}T12:00:00.000Z` : undefined,
  };
  if (status === 'read') book.finishedAt = dateRead;
  if (status === 'reading') book.currentPage = 0;
  for (const key of Object.keys(book) as (keyof ImportBook)[]) if (book[key] === undefined) delete book[key];
  return book;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
const titleKey = (b: { title: string; author: string }) => `${norm(b.title)}|${norm(b.author)}`;

export interface ImportPlan {
  /** Rows with a title. */
  total: number;
  toAdd: ImportBook[];
  /** Skipped because the book is already in the library, or appears twice in the file. */
  duplicates: number;
  counts: { read: number; reading: number; tbr: number };
  /** Read books without a "Date Read", which therefore have no finish date. */
  readWithoutDate: number;
}

/** Works out what an import would add. Duplicates are matched by ISBN, or by title plus author. */
export function planImport(rows: Record<string, string>[], existing: { title: string; author: string; isbn?: string }[]): ImportPlan {
  const isbns = new Set(existing.map((b) => cleanIsbn(b.isbn)).filter(Boolean));
  const titles = new Set(existing.map(titleKey));
  const plan: ImportPlan = { total: 0, toAdd: [], duplicates: 0, counts: { read: 0, reading: 0, tbr: 0 }, readWithoutDate: 0 };
  for (const row of rows) {
    const book = mapGoodreadsRow(row);
    if (!book) continue;
    plan.total++;
    const key = titleKey(book);
    if ((book.isbn && isbns.has(book.isbn)) || titles.has(key)) {
      plan.duplicates++;
      continue;
    }
    if (book.isbn) isbns.add(book.isbn);
    titles.add(key);
    plan.toAdd.push(book);
    plan.counts[book.status]++;
    if (book.status === 'read' && !book.finishedAt) plan.readWithoutDate++;
  }
  return plan;
}
