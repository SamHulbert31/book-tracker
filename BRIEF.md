# Book Tracker: build brief

You are building a personal book tracking app for one user (Sam). It runs as an installable web app on his phone, is hosted free on GitHub Pages, stores its data in a private GitHub repo he owns, and uses a free Gemini API key for its AI features. Nothing in this project may cost money or need a server.

Read this whole brief and every file in `design/` before writing code. Work through the phases at the end in order and commit after each one. Only stop to ask Sam a question if you are truly blocked.

## 1. What the app does

- Tracks books in three states: TBR (to be read), Reading, Read.
- Logs start and finish dates. Finish date is the main one; start date is optional.
- Optional timed reading sessions with a start and stop timer, plus page range.
- Ratings out of 5 stars in half star steps, and a free text review.
- A quote log per book. Quotes shuffle on the home dashboard.
- Stats and charts: monthly and yearly progress, pages, genres, average rating, pace.
- AI: a "suggested next" pick, a short summary of what Sam is enjoying, and genre tagging for books that have none.
- No social features of any kind.

## 2. Design: match the mockups exactly

The four files in `design/` are the approved mockups. Sam has signed them off and wants the real app to look the same.

- `design/home.html` is the home dashboard
- `design/library.html` is the library grid
- `design/book-detail.html` is a single book
- `design/stats.html` is the stats screen

How to read them: each file is reference markup with inline styles. `{{name}}` holes and `<sc-for>` loops are a template syntax; the sample values they loop over are in the script block at the bottom of each file. Ignore the `support.js` line and the template runtime. Take the layout, spacing, sizes, colours, type and copy style from them. All books and numbers in them are placeholder data.

The mockup frames are 390 px wide with a fixed height. In the real app each screen scrolls vertically and the tab bar stays fixed at the bottom.

### Tokens

Colours:

| Token | Hex | Use |
|---|---|---|
| bg | #F3EADB | page background (parchment) |
| card | #FBF6EC | cards, tiles, tab bar |
| border | #E2D5BF | card borders, empty bars |
| track | #E8DCC6 | segmented control track, chips, bar tracks |
| ink | #2A2118 | primary text |
| ink-2 | #4A3F33 | secondary text on cards |
| muted | #6B5D4D | labels, captions |
| green | #26432F | primary colour, buttons, active tab, feature cards |
| on-green | #F3EADB | text on green |
| on-green-soft | #E4DAC4 | secondary text on green |
| gold-label | #D9C48F | small caps labels and links on green |
| star | #A56A12 | filled stars |
| star-empty | #D6C8AE | empty stars |
| oxblood | #7C2F2B | accent label ("Suggested next") |
| bar | #B8A27A | chart bars (highlighted bar uses green) |

Type: Fraunces (weight 600) for headings, book titles, big numbers and quotes. Inter (400, 500, 600) for everything else. Self host both with `@fontsource` packages so the app works offline. Do not load fonts from a CDN.

Shape: cards radius 18, stat tiles radius 14, buttons radius 12, round add button 44 px, chips radius 12. Book covers use radius `4px 8px 8px 4px` with an inset darker strip on the left edge to suggest a spine. Screen side padding 20, gap between sections 14 to 16.

Stars: five star glyphs in star-empty with a clipped overlay of five filled stars whose width is rating × 20 percent. This gives exact half stars. Rating input: tap or drag across the stars, snapping to 0.5.

Covers: when a cover image exists, show it in the same frame with the same radius. When it does not, show the coloured block with the title on it as in the mockups, with the colour picked from a small fixed palette based on a hash of the title.

### Screens not in the mockups

Design these in the same visual language, reusing the same components:

- Library tabs for Reading and TBR (same grid; TBR items have no stars and offer "Start reading")
- Add book flow (search, results, manual entry)
- Edit book sheet (status, dates, rating, review, pages, genres)
- Timed session screen (large timer, start, pause, stop, then page range entry)
- Quotes list (all quotes, searchable, grouped by book) and add or edit quote sheet
- Stats views for Month and All time (the mockup shows the year view)
- Settings (sync, AI key, import, export, about)
- Empty states for a brand new library

## 3. Mobile requirements (must haves)

This is a phone app first. Treat these as acceptance criteria:

- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
- Respect safe areas with `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`. The fixed tab bar adds the bottom inset to its padding. The top of each screen clears the notch or status bar.
- Use `100dvh`, never `100vh`, for full height layouts.
- Every tappable control is at least 44 by 44 px.
- All inputs use a font size of 16 px or more so iOS does not zoom on focus. Use `inputmode="numeric"` for page numbers.
- `touch-action: manipulation` on controls, no reliance on hover, no horizontal scrolling at any width from 360 to 430 px.
- On screens wider than 480 px, centre the app in a 480 px column on a matching background.
- Installable PWA: web manifest (name, short name, `display: standalone`, theme and background colour #F3EADB, icons at 192 and 512 plus a maskable icon), `apple-touch-icon` at 180, `apple-mobile-web-app-capable` and status bar style meta tags.
- Service worker that caches the app shell so the app opens offline (use `vite-plugin-pwa`). Show an "update available" prompt when a new version is deployed.
- Bottom sheets and the keyboard must not hide the field being typed in.
- Test in a 390 by 844 viewport and at 360 px wide before calling a phase done.

## 4. Tech stack

- Vite, React, TypeScript. Hash based routing so GitHub Pages needs no rewrite rules.
- Set Vite `base` to `./` so the app works under `https://<user>.github.io/<repo>/`.
- Styling with plain CSS variables and CSS modules (or one stylesheet). No UI kit.
- Charts are hand built with SVG or flex bars to match the mockups. No chart library.
- IndexedDB through Dexie for on device storage.
- Deploy with a GitHub Actions workflow that builds and publishes to GitHub Pages on every push to `main`.
- Keep dependencies few.

## 5. Data model

All records carry `id` (uuid), `createdAt`, `updatedAt` (ISO strings) and an optional `deletedAt` tombstone.

```ts
type Status = 'tbr' | 'reading' | 'read';

interface Book {
  id: string;
  title: string;
  author: string;
  year?: number;
  pages?: number;
  genres: string[];
  coverUrl?: string;
  status: Status;
  rating?: number;        // 0.5 to 5 in 0.5 steps
  review?: string;
  startedAt?: string;     // date
  finishedAt?: string;    // date
  currentPage?: number;
  isbn?: string;
  openLibraryKey?: string;
  createdAt: string; updatedAt: string; deletedAt?: string;
}

interface Session {
  id: string; bookId: string;
  date: string;
  startPage?: number; endPage?: number;
  durationSec: number;
  createdAt: string; updatedAt: string; deletedAt?: string;
}

interface Quote {
  id: string; bookId: string;
  text: string; page?: number; chapter?: string;
  createdAt: string; updatedAt: string; deletedAt?: string;
}
```

Also store a small `meta` record: schema version, cached AI results with the time they were generated, and last sync time.

## 6. Storage and sync

Data must survive for years, so there are two layers.

1. IndexedDB on the device is what the app reads and writes. The app is fully usable offline.
2. A private GitHub repo is the durable copy. The app syncs one JSON file to it through the GitHub REST contents API.

Settings Sam enters once: GitHub owner, repo name (default `app-data`), file path (default `book-tracker/data.json`), and a fine grained personal access token with Contents read and write on that repo only.

Sync rules:

- On app open and on returning to the foreground: fetch the remote file, merge, then push if the merge changed anything.
- After any local change: push, debounced by about 5 seconds.
- Merge per record by `id`, newest `updatedAt` wins, tombstones win over older edits.
- Use the file `sha` on every PUT. On a 409 or sha mismatch, refetch, merge and retry.
- Commit message such as `book-tracker sync 2026-11-12T08:15`.
- If the file does not exist yet, create it.
- Show a small sync status in Settings and a subtle indicator elsewhere: synced, syncing, offline, error. Errors must say what is wrong in plain words (bad token, repo not found, no connection).
- Base64 encode and decode with full Unicode support.

Also provide manual Export (download the JSON) and Import (load a JSON file) in Settings.

Secrets (GitHub token, Gemini key) live only in `localStorage` on the device. Never write them into the repo, the synced data file, logs, or error messages.

## 7. Adding books

- Search Open Library: `https://openlibrary.org/search.json?q=...&fields=key,title,author_name,first_publish_year,number_of_pages_median,cover_i,subject,isbn&limit=20`. Debounce the search box.
- Covers: `https://covers.openlibrary.org/b/id/<cover_i>-M.jpg`.
- Map `subject` to at most three tidy genres from a fixed list (Science fiction, Fantasy, Non fiction, Classics, Historical, Thriller, Mystery, Romance, Biography, Self improvement, Horror, Other). If the mapping is unclear and an AI key is set, ask the AI to choose.
- Manual entry is always available for books the search misses.
- Goodreads import: accept the Goodreads library export CSV. Map `Title`, `Author`, `My Rating` (0 means unrated), `Number of Pages`, `Date Read`, `Date Added`, `Exclusive Shelf` (`to-read` becomes tbr, `currently-reading` becomes reading, `read` becomes read), `ISBN13` (strip the `="..."` wrapper), `My Review`, `Year Published`. Skip duplicates by ISBN or by title plus author. Show a summary before committing the import.

## 8. Screen behaviour

Home (`design/home.html`):
- Greeting by time of day with today's date.
- Quote card: a random quote on open; the shuffle button picks another. Hidden until at least one quote exists, with a gentle prompt in its place.
- Currently reading card with progress bar from `currentPage / pages`. "Log a session" opens a quick sheet: update current page, or start a timed session. If several books are being read, the card swipes between them.
- Three tiles: books finished this month, pages this month, day streak. A streak day is any day with a session or a page update.
- "Books finished in <year>" bar chart by month, current month highlighted.
- "Suggested next" card (AI, see section 9). Hidden when no AI key is set.

Library (`design/library.html`):
- Search across title, author and genre. Segmented tabs Read, Reading, TBR with counts.
- Sort (date finished, rating, title, author, date added) and filter by genre and rating.
- Three column cover grid. Tap opens the book.

Book detail (`design/book-detail.html`):
- Cover, title, author, year, pages, genre chips, star rating.
- Started, Finished and Time taken tiles. Tapping a date edits it.
- Review card, tap to edit.
- Reading sessions list with total time, and "Start a timed session".
- Quotes card with count, latest quote, "Add quote", and a link to all quotes for this book.
- Status changes: Start reading, Mark as finished (asks for finish date, rating and review in one sheet, all optional except the date, which defaults to today), Move back to TBR, Delete.

Stats (`design/stats.html`):
- Period switch: Month, year (current year by default, with a way to pick other years), All time.
- Tiles: books finished, pages read, average rating, average days per book (only books with both dates).
- Pages by month chart, best month called out.
- Genres bar list, top five plus Other.
- Also include below the mockup content: rating distribution, longest and shortest book, most read authors, total reading time from sessions.
- "What you are enjoying" card (AI). Hidden when no AI key is set.

Pages read in a period: sum of pages for books finished in that period, plus session page ranges for books still in progress.

## 9. AI

Build a small provider layer: `generate(prompt, jsonSchema?) => Promise<result>`, with a Gemini implementation that calls the Generative Language REST API directly from the browser using the key from Settings. Look up the current Gemini API docs for the endpoint and for a model that is on the free tier; do not assume a model name from memory. Make the model name editable in Settings. Structure the layer so another provider (for example Anthropic) can be added later without touching the features.

Rules:

- Every AI feature is optional. With no key, the app is complete and the AI cards are hidden.
- Ask for JSON, validate it, and fail quietly to a neutral state.
- Handle 429 and quota errors with a friendly message and no retry loops.
- Cache results in `meta`. Regenerate only when Sam taps refresh, or automatically at most once a day when the underlying data has changed.
- Send only what is needed: titles, authors, genres, ratings, dates. Never send the tokens.

Features:

1. Suggested next: given read books with ratings and the TBR list, return one pick from the TBR (preferred) with a one sentence reason, plus up to three books not in the library that Sam might like. Each new suggestion has an "Add to TBR" button.
2. What you are enjoying: two or three sentences grounded in numbers the app computes and passes in (genre counts, average rating by genre, pace by genre). The AI must not invent numbers.
3. Genre tagging for manually added or imported books that have no genres.

## 10. Settings screen

- Sync: owner, repo, path, token, "Test connection", "Sync now", last synced time.
- AI: Gemini key, model name, "Test".
- Data: Import from Goodreads CSV, Export JSON, Import JSON.
- About: app version and build date.

## 11. Phases

1. Scaffold: Vite, React, TypeScript, routing, tokens, fonts, tab bar, PWA manifest and service worker, GitHub Actions deploy. Empty screens that already look right on a phone.
2. Data layer and core flows: Dexie, add book (Open Library and manual), library, book detail, status changes, ratings, reviews.
3. Home dashboard and stats with real data.
4. Sessions with timer, quotes, quote shuffle.
5. GitHub sync, export and import, Goodreads import, Settings.
6. AI layer and the three AI features.
7. Polish: empty states, loading states, safe areas, offline behaviour, a final pass comparing every screen against `design/` at 390 px wide.

Write a short `README.md` covering how to run locally, how deploy works, and the one time setup Sam does in the app's Settings.

## 12. Done means

- Each of the four mocked screens matches its file in `design/` when filled with similar data.
- The app installs to a phone home screen, opens offline, and nothing is hidden by the notch, home indicator or keyboard.
- Data written on the phone appears in the private repo, and a fresh install on another device restores everything after entering the same settings.
- With no AI key the app has no broken or empty AI areas.
- No secrets in the repo.
