# Library

A personal book tracker that installs to your phone's home screen. It is a static web app (Vite, React, TypeScript), hosted free on GitHub Pages. Your data stays on the device and syncs to a private GitHub repo you own. Nothing here needs a server or costs money.

See `BRIEF.md` for the full spec and `design/` for the approved mockups. The build is split into phases. Phases 1 to 5 are done: scaffold and PWA, the data layer with add book / library / book detail, the home dashboard and stats, reading sessions (with a timer) and quotes, and GitHub sync with export, import, Goodreads import and Settings. Still to come: the AI features (phase 6) and a polish pass (phase 7).

Data is stored in the browser on the device and synced to your private repo once Settings is filled in, so set that up before clearing site data.

## Run locally

```sh
npm install
npm run dev        # dev server with hot reload
npm run build      # typecheck, then build into dist/
npm run preview    # serve the production build
```

The service worker only runs in the production build, so test offline behaviour with `npm run build && npm run preview`.

## App icon

The icon is drawn once, in `assets/icon.svg`. `npm run icons` regenerates every size from it into `public/`: 192, 512, maskable 512, the 180 px Apple touch icon, the favicon PNG and `favicon.svg`. The generated files are committed, so you only need to run it after changing the SVG.

## How deploy works

`.github/workflows/deploy.yml` builds the app and publishes `dist/` to GitHub Pages on every push to `main`. Vite's `base` is `./` and routing is hash based, so the app works under `https://<user>.github.io/<repo>/` with no rewrite rules.

One time setup on GitHub: open the repo's **Settings > Pages** and set **Source** to **GitHub Actions**.

When a new version is deployed, the installed app shows an "A new version is available" bar with an Update button.

## One time setup in the app

Open **Settings** (the gear on Home).

- **Sync:** GitHub owner, repo name (default `app-data`), file path (default `book-tracker/data.json`) and a fine grained personal access token with **Contents: read and write** on that one repo. Tap **Test connection**, then **Sync now**. The data file is created on the first sync, so the repo only needs to exist. The app then syncs on open, when you return to it, and about five seconds after any change.
- **AI (optional):** a free Gemini API key and model name. Stored for the AI features, which come in a later phase.
- **Data:** import a Goodreads library export (CSV; Goodreads > My Books > Import and export), and export or import the app's own JSON.

The token and key are kept only in `localStorage` on the device. They are never written to the repo, the synced data file, an export or an error message.

## Tests

`npm test` runs one small test of the Goodreads row mapping.
