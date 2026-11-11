import { useEffect, useMemo, useRef, useState } from 'react';
import { db, SCHEMA_VERSION } from '../db/db';
import { useMeta } from '../db/hooks';
import { readSettings } from '../sync/config';
import { AiError, geminiProvider, type AiProvider } from './provider';

/** The provider for the key and model in Settings, or null when there is no key (then every AI area stays hidden). */
export function currentProvider(): AiProvider | null {
  const { geminiKey, geminiModel } = readSettings();
  return geminiKey.trim() ? geminiProvider(geminiKey, geminiModel) : null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

interface Plan<T> {
  dataKey: string;
  run: (provider: AiProvider) => Promise<T>;
}

/**
 * A cached AI result for one feature. It is made on first view, and after that only when
 * Refresh is tapped or, at most once a day, when the data behind it has changed. A failed
 * automatic attempt is silent and is not retried until the data changes again.
 */
export function useAiResult<T>(feature: string, plan: Plan<T> | null) {
  const meta = useMeta();
  const provider = useMemo(() => currentProvider(), []);
  const cached = meta?.ai?.[feature] as { generatedAt: string; result: T; dataKey?: string } | undefined;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const planRef = useRef(plan);
  planRef.current = plan;
  const attempted = useRef<string | undefined>(undefined);

  async function run(manual: boolean) {
    const current = planRef.current;
    if (!provider || !current) return;
    setBusy(true);
    setError(undefined);
    try {
      const result = await current.run(provider);
      await db.transaction('rw', db.meta, async () => {
        const record = (await db.meta.get('main')) ?? { key: 'main' as const, schemaVersion: SCHEMA_VERSION };
        await db.meta.put({ ...record, ai: { ...record.ai, [feature]: { generatedAt: new Date().toISOString(), result, dataKey: current.dataKey } } });
      });
    } catch (e) {
      // Automatic attempts fail quietly; a tap on Refresh says what went wrong.
      if (manual) setError(e instanceof AiError ? e.message : 'Gemini could not help this time.');
    } finally {
      setBusy(false);
    }
  }

  const dataKey = plan?.dataKey;
  useEffect(() => {
    if (!provider || dataKey === undefined || meta === undefined || attempted.current === dataKey) return;
    const stale = !cached || (Date.now() - Date.parse(cached.generatedAt) > DAY_MS && cached.dataKey !== dataKey);
    if (!stale) return;
    attempted.current = dataKey;
    void run(false);
    // `run` only reads refs and state setters; the inputs that matter are listed.
  }, [provider, dataKey, meta, cached]);

  return { enabled: provider !== null, result: cached?.result, busy, error, refresh: () => run(true) };
}
