import { useState, useEffect, useCallback, useMemo } from 'react';
import { TABLES, supabase } from '../lib/supabaseClient';
import { subscribeToTable } from '../lib/supabase';
import { SAMPLE_TOKENS } from '../lib/sampleData';
import type { TrackedToken, ConnectionState } from '../types';

interface UseTrackedTokensOptions {
  tokenAddress?: string | null;
  verifiedOnly?: boolean;
}

interface TrackedTokensResult {
  tokens: TrackedToken[];
  byAddress: Record<string, TrackedToken>;
  loading: boolean;
  error: string | null;
  connection: ConnectionState;
  usingExamples: boolean;
  refresh: () => void;
  getToken: (address: string) => TrackedToken | undefined;
}

/**
 * Loads tracked BASE tokens with verification status/metadata for the ticker
 * list and inspector enrichment. Falls back to labeled EXAMPLE tokens until the
 * pipeline writes real verified tokens. Never fabricates live verified data.
 */
export function useTrackedTokens(
  opts: UseTrackedTokensOptions = {}
): TrackedTokensResult {
  const { tokenAddress, verifiedOnly } = opts;
  const [tokens, setTokens] = useState<TrackedToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<ConnectionState>('connecting');
  const [usingExamples, setUsingExamples] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from(TABLES.trackedTokens())
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300);
      if (tokenAddress) q = q.eq('token_address', tokenAddress);
      if (verifiedOnly) q = q.eq('verified', true);
      const { data, error: qErr } = await q;
      if (qErr) {
        const msg = (qErr.message || '').toLowerCase();
        if (msg.includes('does not exist')) {
          setTokens(tokenAddress ? [] : SAMPLE_TOKENS);
          setUsingExamples(!tokenAddress);
          setConnection('online');
          return;
        }
        throw qErr;
      }
      const rows = (data as TrackedToken[]) ?? [];
      if (rows.length === 0 && !tokenAddress) {
        setTokens(SAMPLE_TOKENS);
        setUsingExamples(true);
      } else {
        setTokens(rows);
        setUsingExamples(false);
      }
      setConnection('online');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'tokens unavailable');
      if (!tokenAddress) {
        setTokens(SAMPLE_TOKENS);
        setUsingExamples(true);
      }
      setConnection('error');
    } finally {
      setLoading(false);
    }
  }, [tokenAddress, verifiedOnly]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsub = subscribeToTable(
      'tracked_tokens',
      (payload: any) => {
        const row = payload.new as TrackedToken;
        if (!row) return;
        if (tokenAddress && row.token_address !== tokenAddress) return;
        if (verifiedOnly && !row.verified) return;
        setUsingExamples(false);
        setTokens((prev) => {
          const idx = prev.findIndex((t) => t.id === row.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...row };
            return next;
          }
          // drop examples once a real token arrives
          const real = prev.filter((t) => !t.id.startsWith('ext-'));
          return [row, ...real].slice(0, 300);
        });
        setConnection('online');
      },
      { event: '*' }
    );
    return unsub;
  }, [tokenAddress, verifiedOnly]);

  const byAddress = useMemo(() => {
    const map: Record<string, TrackedToken> = {};
    for (const t of tokens) map[t.token_address] = t;
    return map;
  }, [tokens]);

  const getToken = useCallback(
    (address: string) => byAddress[address],
    [byAddress]
  );

  return {
    tokens,
    byAddress,
    loading,
    error,
    connection,
    usingExamples,
    refresh: load,
    getToken,
  };
}
