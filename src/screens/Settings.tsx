import { useRef, useState } from 'react';
import { useBooks, useMeta } from '../db/hooks';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { BackLink } from '../components/BackLink';
import { Button } from '../components/Button';
import { Card, CardTitle } from '../components/Card';
import { Field, Input } from '../components/Field';
import { GoodreadsSheet } from '../sheets/GoodreadsSheet';
import { syncEngine, useSyncState } from '../sync';
import { DEFAULT_PATH, DEFAULT_REPO, readSettings, syncConfig, writeSettings, type DeviceSettings } from '../sync/config';
import { exportJson, importJson, readFileText } from '../sync/file';
import { GitHubError, testConnection } from '../sync/github';
import { AiError, DEFAULT_GEMINI_MODEL, geminiProvider } from '../ai/provider';
import { planImport, readGoodreadsRows, type ImportPlan } from '../lib/goodreads';
import styles from './Settings.module.css';

const STATUS_WORDS = { off: 'Not set up', synced: 'Synced', syncing: 'Syncing', offline: 'Offline', error: 'Error' } as const;

const whenText = (iso: string | undefined) => {
  if (!iso) return 'never';
  const d = new Date(iso);
  const time = d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
  return d.toDateString() === new Date().toDateString() ? `today at ${time}` : `${d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} at ${time}`;
};

interface Note {
  ok: boolean;
  text: string;
}

const noteClass = (n: Note) => (n.ok ? styles.ok : styles.bad);

export function Settings() {
  const books = useBooks();
  const meta = useMeta();
  const sync = useSyncState();
  const [s, setS] = useState<DeviceSettings>(readSettings);
  const [showToken, setShowToken] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [test, setTest] = useState<Note | null>(null);
  const [testing, setTesting] = useState(false);
  const [aiTest, setAiTest] = useState<Note | null>(null);
  const [aiTesting, setAiTesting] = useState(false);
  const [dataNote, setDataNote] = useState<Note | null>(null);
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const jsonInput = useRef<HTMLInputElement>(null);
  const csvInput = useRef<HTMLInputElement>(null);

  // Saved as you type. Values are trimmed on the way into storage.
  function save(patch: Partial<DeviceSettings>) {
    setS({ ...s, ...patch });
    writeSettings(patch);
    syncEngine.refresh();
    setTest(null);
    setAiTest(null);
  }

  async function testAi() {
    if (!s.geminiKey.trim()) return setAiTest({ ok: false, text: 'Enter a Gemini API key first.' });
    setAiTesting(true);
    try {
      const reply = await geminiProvider(s.geminiKey, s.geminiModel).generate('Reply with the single word OK.');
      setAiTest({ ok: true, text: `Gemini answered: ${reply.trim().slice(0, 40)}` });
    } catch (e) {
      setAiTest({ ok: false, text: e instanceof AiError ? e.message : 'Could not reach Gemini.' });
    } finally {
      setAiTesting(false);
    }
  }

  async function testSync() {
    const cfg = syncConfig(s);
    if (!cfg) return setTest({ ok: false, text: 'Fill in the owner, repo, path and token first.' });
    setTesting(true);
    try {
      const info = await testConnection(cfg);
      setTest({
        ok: info.canWrite,
        text: info.canWrite
          ? `Connected to ${info.fullName}${info.isPrivate ? ' (private)' : ' (public: anyone can read your data)'}. The token can read and write.`
          : `Connected to ${info.fullName}, but the token can only read. It needs Contents read and write.`,
      });
    } catch (e) {
      setTest({ ok: false, text: e instanceof GitHubError ? e.message : 'Could not reach GitHub.' });
    } finally {
      setTesting(false);
    }
  }

  async function onJsonFile(file: File | undefined) {
    if (!file) return;
    try {
      const r = await importJson(await readFileText(file));
      const parts = [`${r.books} ${r.books === 1 ? 'book' : 'books'}`, `${r.sessions} ${r.sessions === 1 ? 'session' : 'sessions'}`, `${r.quotes} ${r.quotes === 1 ? 'quote' : 'quotes'}`];
      setDataNote({ ok: true, text: r.books + r.sessions + r.quotes === 0 ? 'Nothing new in that file; everything in it was already here.' : `Imported ${parts.join(', ')}.` });
    } catch (e) {
      setDataNote({ ok: false, text: e instanceof Error ? e.message : 'Import failed.' });
    }
    if (jsonInput.current) jsonInput.current.value = '';
  }

  async function onCsvFile(file: File | undefined) {
    if (!file) return;
    try {
      setPlan(planImport(readGoodreadsRows(await readFileText(file)), books ?? []));
      setDataNote(null);
    } catch (e) {
      setDataNote({ ok: false, text: e instanceof Error ? e.message : 'Import failed.' });
    }
    if (csvInput.current) csvInput.current.value = '';
  }

  return (
    <Screen gap={14} compactTop>
      <BackLink to="/">Home</BackLink>
      <ScreenHeader title="Settings" />

      <Card gap={10}>
        <CardTitle>Sync</CardTitle>
        <p className={styles.note}>Your data syncs to a private GitHub repo you own. The token stays on this device.</p>
        <Field label="GitHub owner">
          <Input value={s.owner} onChange={(e) => save({ owner: e.target.value })} autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="your-username" />
        </Field>
        <Field label="Repo name">
          <Input value={s.repo} onChange={(e) => save({ repo: e.target.value })} autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder={DEFAULT_REPO} />
        </Field>
        <Field label="File path">
          <Input value={s.path} onChange={(e) => save({ path: e.target.value })} autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder={DEFAULT_PATH} />
        </Field>
        <Field label="Fine grained personal access token" hint="Contents: read and write, on that one repo only.">
          <div className={styles.secret}>
            <Input type={showToken ? 'text' : 'password'} value={s.token} onChange={(e) => save({ token: e.target.value })} autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="github_pat_…" />
            <button type="button" className={styles.reveal} onClick={() => setShowToken((v) => !v)}>
              {showToken ? 'Hide' : 'Show'}
            </button>
          </div>
        </Field>
        <div className={styles.pair}>
          <Button variant="outline" disabled={testing} onClick={testSync}>
            {testing ? 'Testing…' : 'Test connection'}
          </Button>
          <Button variant="outline" disabled={sync.status === 'off' || sync.status === 'syncing'} onClick={() => void syncEngine.sync()}>
            Sync now
          </Button>
        </div>
        {test && (
          <p className={`${styles.note} ${noteClass(test)}`} role="status">
            {test.text}
          </p>
        )}
        <div className={styles.statusRow} role="status" aria-live="polite">
          <span className={`${styles.dot} ${styles[sync.status]}`}>{STATUS_WORDS[sync.status]}</span>
          <span className={styles.note}>last synced {whenText(sync.lastSync ?? meta?.lastSyncAt)}</span>
        </div>
        {sync.status === 'error' && sync.message && <p className={`${styles.note} ${styles.bad}`}>{sync.message}</p>}
        {sync.status === 'off' && <p className={styles.note}>Fill in all four fields to turn sync on.</p>}
      </Card>

      <Card gap={10}>
        <CardTitle>AI</CardTitle>
        <p className={styles.note}>Optional. With a free Gemini key the app suggests what to read next, summarises what you enjoy, and tags books that have no genre. Without one, those cards stay hidden and everything else works. The key is stored only on this device, and only titles, authors, genres, ratings, dates and counts are ever sent.</p>
        <Field label="Gemini API key">
          <div className={styles.secret}>
            <Input type={showKey ? 'text' : 'password'} value={s.geminiKey} onChange={(e) => save({ geminiKey: e.target.value })} autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
            <button type="button" className={styles.reveal} onClick={() => setShowKey((v) => !v)}>
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
        </Field>
        <Field label="Model name">
          <Input value={s.geminiModel} onChange={(e) => save({ geminiModel: e.target.value })} autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder={DEFAULT_GEMINI_MODEL} />
        </Field>
        <p className={styles.note}>Blank uses {DEFAULT_GEMINI_MODEL}, which is on the free tier.</p>
        <Button variant="outline" block disabled={aiTesting} onClick={testAi}>
          {aiTesting ? 'Testing…' : 'Test'}
        </Button>
        {aiTest && (
          <p className={`${styles.note} ${noteClass(aiTest)}`} role="status">
            {aiTest.text}
          </p>
        )}
      </Card>

      <Card gap={10}>
        <CardTitle>Data</CardTitle>
        <Button variant="outline" block onClick={() => csvInput.current?.click()}>
          Import from Goodreads CSV
        </Button>
        <div className={styles.pair}>
          <Button variant="outline" onClick={() => void exportJson()}>
            Export JSON
          </Button>
          <Button variant="outline" onClick={() => jsonInput.current?.click()}>
            Import JSON
          </Button>
        </div>
        <input ref={csvInput} type="file" accept=".csv,text/csv" hidden aria-label="Goodreads CSV file" onChange={(e) => void onCsvFile(e.target.files?.[0])} />
        <input ref={jsonInput} type="file" accept=".json,application/json" hidden aria-label="Import JSON file" onChange={(e) => void onJsonFile(e.target.files?.[0])} />
        <p className={styles.note}>Export downloads everything as one file. Import merges a file in; newer records win, so nothing here is lost.</p>
        {dataNote && (
          <p className={`${styles.note} ${noteClass(dataNote)}`} role="status">
            {dataNote.text}
          </p>
        )}
      </Card>

      <Card gap={6}>
        <CardTitle>About</CardTitle>
        <p className={styles.note}>
          Library {__APP_VERSION__} · built {new Date(__BUILD_DATE__).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </Card>

      {plan && (
        <GoodreadsSheet
          plan={plan}
          onClose={() => setPlan(null)}
          onDone={(added) => {
            setPlan(null);
            setDataNote({ ok: true, text: `Imported ${added} ${added === 1 ? 'book' : 'books'} from Goodreads.` });
          }}
        />
      )}
    </Screen>
  );
}
