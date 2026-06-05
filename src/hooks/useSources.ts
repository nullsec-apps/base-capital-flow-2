import { useState, useEffect, useCallback } from 'react';
import { TABLES, supabase } from '../lib/supabaseClient';
import { SAMPLE_SOURCES } from '../lib/sampleData';
import type { Source, ConnectionState } from '../types';

export type SourceHealth = 'healthy' | 'stale' | 'error' | 'idle';

interface SourcesResult {
  sources: Source[];
  loading: boolean;
  error: string | null;
  connection: ConnectionState;
  health: SourceHealth;
  lastIngestAt: string | null;
  usingExamples: boolean;
  refresh: () => void;
}

const STALE_MS = 5 * 60 * 1000;

function deriveHealth(sources: Source[]): { health: SourceHealth; lastIngestAt: string | null } {
  if (!sources.length) return { health: 'idle', lastIngestAt: null };
  const runs = sources
    .map((s) => (s.last_run_at ? new Date(s.last_run_at).getTime() : 0))
    .filter((t) => t > 0);
  const last = runs.length ? Math.max(...runs) : 0;
  const lastIngestAt = last ? new Date(last).toISOString() : null;

  const anyError = sources.some((s) => (s.status || '').toLowerCase() === 'error');
  if (anyError) return { health: 'error', lastIngestAt };
  if (!last) return { health: 'idle', lastIngestAt };
  if (Date.now() - last > STALE_MS) return { health: 'stale', lastIngestAt };
  return { health: 'healthy', lastIngestAt };
}

/**
 * Reads configured data sources for StatusBar health + last-ingest timestamp.
 * Falls back to clearly-labeled EXAMPLE sources until the pipeline registers real ones.
 */
export function useSources(): SourcesResult {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<ConnectionState>('connecting');
  const [usingExamples, setUsingExamples] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from(TABLES.sources())
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (qErr) {
        const msg = (qErr.message || '').toLowerCase();
        if (msg.includes('does not exist')) {
          setSources(SAMPLE_SOURCES);
          setUsingExamples(true);
          setConnection('online');
          return;
        }
        throw qErr;
      }
      const rows = (data as Source[]) ?? [];
      if (rows.length === 0) {
        setSources(SAMPLE_SOURCES);
        setUsingExamples(true);
      } else {
        setSources(rows);
        setUsingExamples(false);
      }
      setConnection('online');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'sources unavailable');
      setSources(SAMPLE_SOURCES);
      setUsingExamples(true);
      setConnection('error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  const { health, lastIngestAt } = deriveHealth(sources);

  return {
    sources,
    loading,
    error,
    connection,
    health,
    lastIngestAt,
    usingExamples,
    refresh: load,
  };
}
