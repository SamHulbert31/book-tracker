import type { Book } from '../db/types';
import { GENRES } from '../lib/genres';
import { averageDays, averageRating, finishedIn } from '../lib/stats';
import { AiError, type AiProvider } from './provider';

// The three AI features. Each builds a prompt from only what it needs (titles, authors, genres,
// ratings, dates and counts the app computed), asks for JSON, checks the answer against the
// library and the rules, and throws an AiError when it cannot be trusted. Callers fall back to
// showing nothing.

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
const clip = (s: unknown, max: number) => (typeof s === 'string' ? s.trim().slice(0, max) : '');

function parseJson<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new AiError('invalid', 'Gemini did not answer with valid JSON.');
  }
}

/** Small stable fingerprint, used to tell whether the data behind a cached answer has changed. */
export function fingerprint(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

// ---------------------------------------------------------------- Suggested next

export interface SuggestedNextResult {
  pick?: { bookId: string; title: string; author: string; reason: string };
  discoveries: { title: string; author: string; reason: string }[];
}

const SUGGEST_SCHEMA = {
  type: 'object',
  properties: {
    pick: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The id of one book from the to-be-read list.' },
        reason: { type: 'string', description: 'One sentence.' },
      },
      required: ['id', 'reason'],
    },
    discoveries: {
      type: 'array',
      maxItems: 3,
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, author: { type: 'string' }, reason: { type: 'string', description: 'A short phrase.' } },
        required: ['title', 'author', 'reason'],
      },
    },
  },
  required: ['discoveries'],
};

export interface SuggestPlan {
  dataKey: string;
  run: (provider: AiProvider) => Promise<SuggestedNextResult>;
}

/** Null when there is not enough to go on: nothing to pick from, and too few ratings to find a taste. */
export function suggestedNextPlan(books: Book[]): SuggestPlan | null {
  const tbr = books.filter((b) => b.status === 'tbr');
  const rated = books.filter((b) => b.status === 'read' && b.rating !== undefined);
  if (tbr.length === 0 && rated.length < 3) return null;

  const readLines = [...rated]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''))
    .slice(0, 80)
    .map((b) => `${b.title} | ${b.author || 'unknown'} | ${b.genres.join(', ') || 'no genre'} | ${b.rating}/5`);
  const tbrLines = tbr.slice(0, 80).map((b) => `${b.id} | ${b.title} | ${b.author || 'unknown'} | ${b.genres.join(', ') || 'no genre'}${b.pages ? ` | ${b.pages} pages` : ''}`);
  const known = new Set(books.map((b) => `${norm(b.title)}|${norm(b.author)}`));
  const tbrIds = new Set(tbr.map((b) => b.id));

  const prompt = [
    'You are a thoughtful book recommender for one reader.',
    '',
    'Books they have read, best rated first (title | author | genres | rating):',
    readLines.length ? readLines.join('\n') : 'none rated yet',
    '',
    'Their to-be-read list (id | title | author | genres | pages):',
    tbrLines.length ? tbrLines.join('\n') : 'empty',
    '',
    'Rules:',
    '- From the to-be-read list, pick the one book most likely to suit them next. Give its id exactly as listed and one sentence on why, based on their ratings and genres. If the list is empty, leave pick out.',
    '- Also suggest up to three books that are in neither list that they might like, each with title, author and a short reason.',
    '- Do not state any number or statistic that is not in the lists above.',
    'Answer with JSON only.',
  ].join('\n');

  return {
    dataKey: fingerprint([...tbr, ...rated].map((b) => `${b.id}:${b.status}:${b.rating ?? ''}`).sort().join(',')),
    async run(provider) {
      const parsed = parseJson<{ pick?: { id?: unknown; reason?: unknown }; discoveries?: { title?: unknown; author?: unknown; reason?: unknown }[] }>(
        await provider.generate(prompt, SUGGEST_SCHEMA),
      );
      const result: SuggestedNextResult = { discoveries: [] };
      const pickId = typeof parsed.pick?.id === 'string' ? parsed.pick.id : '';
      const reason = clip(parsed.pick?.reason, 220);
      if (tbrIds.has(pickId) && reason) {
        const book = tbr.find((b) => b.id === pickId)!;
        result.pick = { bookId: book.id, title: book.title, author: book.author, reason };
      }
      const seen = new Set<string>();
      for (const d of Array.isArray(parsed.discoveries) ? parsed.discoveries : []) {
        const title = clip(d.title, 120);
        const author = clip(d.author, 80);
        const key = `${norm(title)}|${norm(author)}`;
        // Only books the library does not already have, and no repeats.
        if (!title || known.has(key) || seen.has(key)) continue;
        seen.add(key);
        result.discoveries.push({ title, author, reason: clip(d.reason, 160) });
        if (result.discoveries.length === 3) break;
      }
      if (!result.pick && result.discoveries.length === 0) throw new AiError('invalid', 'Gemini did not suggest anything usable.');
      return result;
    },
  };
}

// ---------------------------------------------------------------- What you are enjoying

export interface EnjoyingResult {
  summary: string;
}

const ENJOYING_SCHEMA = {
  type: 'object',
  properties: { summary: { type: 'string', description: 'Two or three sentences.' } },
  required: ['summary'],
};

export interface EnjoyingPlan {
  dataKey: string;
  run: (provider: AiProvider) => Promise<EnjoyingResult>;
}

/** Null until there are at least three finished books and some tagged genres. */
export function enjoyingPlan(books: Book[]): EnjoyingPlan | null {
  const finished = finishedIn(books, { kind: 'all' });
  if (finished.length < 3) return null;

  // Every figure the AI may use is worked out here; the answer is rejected if it contains any other number.
  const byGenre = new Map<string, Book[]>();
  for (const b of finished) for (const g of b.genres) byGenre.set(g, [...(byGenre.get(g) ?? []), b]);
  const genres = [...byGenre.entries()]
    .map(([name, list]) => ({ name, count: list.length, rating: averageRating(list), days: averageDays(list) }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 6);
  if (genres.length === 0) return null;

  const overall = averageRating(finished);
  const allowed = new Set<number>([finished.length]);
  const lines = genres.map((g) => {
    allowed.add(g.count);
    const parts = [`${g.count} book${g.count === 1 ? '' : 's'} finished`];
    if (g.rating !== undefined) {
      allowed.add(Number(g.rating.toFixed(1)));
      parts.push(`average rating ${g.rating.toFixed(1)}`);
    }
    if (g.days !== undefined) {
      allowed.add(Math.round(g.days));
      parts.push(`about ${Math.round(g.days)} days per book`);
    }
    return `${g.name}: ${parts.join(', ')}`;
  });
  if (overall !== undefined) allowed.add(Number(overall.toFixed(1)));

  const prompt = [
    'You are summarising one reader\'s taste from figures their reading tracker computed.',
    '',
    `Books finished in total: ${finished.length}.${overall !== undefined ? ` Average rating overall: ${overall.toFixed(1)}.` : ''}`,
    'By genre:',
    ...lines,
    '',
    'Write two or three sentences addressed to the reader as "you", saying what they seem to enjoy most and anything that stands out (for example a genre they rate lower or take longer over).',
    'Use only the figures above. Do not state any number that is not listed. No markdown, no lists.',
    'Answer with JSON only.',
  ].join('\n');

  return {
    dataKey: fingerprint(prompt),
    async run(provider) {
      const parsed = parseJson<{ summary?: unknown }>(await provider.generate(prompt, ENJOYING_SCHEMA));
      const summary = clip(parsed.summary, 600);
      if (summary.length < 20) throw new AiError('invalid', 'Gemini sent an empty summary.');
      // The AI must not invent numbers: every figure in the text has to be one we gave it.
      for (const n of summary.match(/\d+(?:\.\d+)?/g) ?? []) {
        if (!allowed.has(Number(n))) throw new AiError('invalid', 'Gemini used a figure that was not in the data.');
      }
      return { summary };
    },
  };
}

// ---------------------------------------------------------------- Genre tagging

const TAG_SCHEMA = {
  type: 'object',
  properties: {
    books: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          genres: { type: 'array', minItems: 1, maxItems: 3, items: { type: 'string', enum: [...GENRES] } },
        },
        required: ['id', 'genres'],
      },
    },
  },
  required: ['books'],
};

/** Genres for books that have none. Returns book id to one to three genres from the fixed list. */
export async function tagGenres(provider: AiProvider, batch: Book[]): Promise<Map<string, string[]>> {
  const prompt = [
    'Assign genres to these books. Choose one to three for each from exactly this list:',
    GENRES.join(', ') + '.',
    'If a book does not fit any, use Other. Use only the title, author and year.',
    '',
    'Books (id | title | author | year):',
    ...batch.map((b) => `${b.id} | ${b.title} | ${b.author || 'unknown'} | ${b.year ?? 'unknown'}`),
    '',
    'Answer with JSON only.',
  ].join('\n');

  const parsed = parseJson<{ books?: { id?: unknown; genres?: unknown }[] }>(await provider.generate(prompt, TAG_SCHEMA));
  const ids = new Set(batch.map((b) => b.id));
  const valid = new Set<string>(GENRES);
  const out = new Map<string, string[]>();
  for (const item of Array.isArray(parsed.books) ? parsed.books : []) {
    if (typeof item.id !== 'string' || !ids.has(item.id) || !Array.isArray(item.genres)) continue;
    const genres = [...new Set(item.genres.filter((g): g is string => typeof g === 'string' && valid.has(g)))].slice(0, 3);
    if (genres.length > 0) out.set(item.id, genres);
  }
  return out;
}
