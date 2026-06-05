import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { TABLES, supabase } from '../lib/supabaseClient';
import { subscribeToTable } from '../lib/supabase';
import { isAnomaly, Z_CRITICAL } from '../lib/zscore';
import { periodCutoff, type useFilters } from './useFilters';
import { BASELINE, SAMPLE_SNAPSHOTS } from '../lib/sampleData';
import type { FlowSnapshot, ConnectionState } from '../types';

type Filters = ReturnType<typeof useFilters>['filters'];

export interface AnomalyRow extends FlowSnapshot {
  /** transient flash on first realtime appearance */
  flash?: 'green' | 'red' | null;
}

interface AnomalyFeedResult {
  rows: AnomalyRow[];
  /** faint historical rows shown when no live anomalies match (never blank) */
  baselineRows: FlowSnapshot[];
  loading: boolean;
  error: string | null;
  connection: ConnectionState;
  isEmpty: boolean;
  usingExamples: boolean;
  baselineCopy: { noAnomalyMsg: string; baselineInflow: string };
  maxInflow: number;
  selectedIndex: number;
  setSelectedIndex: (i: number) => void;
  refresh: () => void;
}

function sortRows(rows: AnomalyRow[], key: Filters['sortKey']): AnomalyRow[] {
  const arr = [...rows];
  switch (key) {
    case 'inflow':
      arr.sort((a, b) => (b.net_inflow_usd ?? 0) - (a.net_inflow_usd ?? 0));
      break;
    case 'buyers':
      arr.sort((a, b) => (b.unique_buyers ?? 0) - (a.unique_buyers ?? 0));
      break;
    case 'recency':
      arr.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      break;
    case 'zscore':
    default:
      arr.sort((a, b) => (b.z_score ?? 0) - (a.z_score ?? 0));
  }
  return arr;
}

function matchesFilters(r: FlowSnapshot, filters: Filters): boolean {
  const inflow = r.net_inflow_usd ?? 0;
  if (inflow < filters.amountMin) return false;
  if (filters.amountMax > 0 && inflow > filters.amountMax) return false;
  if (filters.contractType !== 'all') {
    const t = (r.contract_type ?? 'other').toLowerCase();
    if (t !== filters.contractType) return false;
  }
  if (filters.verifiedOnly && !r.verified) return false;
  if (filters.tokenAddress && r.token_address !== filters.tokenAddress) return false;
  if ((r.z_score ?? 0) < filters.zThreshold) return false;
  return true;
}

/**
 * Queries flagged snapshots (z_score >= threshold) with filter/sort params,
 * merges realtime inserts, and supplies baseline copy + faint historical rows
 * when no live anomalies match so the deck never feels dead.
 */
export function useAnomalyFeed(filters: Filters): AnomalyFeedResult {
  const [rows, setRows] = useState<AnomalyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<ConnectionState>('connecting');
  const [usingExamples, setUsingExamples] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const flashTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const f = filtersRef.current;
      const cutoff = periodCutoff(f.period);
      const { data, error: qErr } = await supabase
        .from(TABLES.flowSnapshots())
        .select('*')
        .gte('created_at', cutoff)
        .gte('z_score', f.zThreshold)
        .order('z_score', { ascending: false })
        .limit(300);
      if (qErr) {
        const msg = (qErr.message || '').toLowerCase();
        if (msg.includes('does not exist')) {
          setRows([]);
          setUsingExamples(true);
          setConnection('online');
          return;
        }
        throw qErr;
      }
      const fetched = ((data as FlowSnapshot[]) ?? []).map((d) => ({
        ...d,
        flash: null as AnomalyRow['flash'],
      }));
      setRows(fetched);
      setUsingExamples(fetched.length === 0);
      setConnection('online');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'feed unavailable');
      setUsingExamples(true);
      setConnection('error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, filters.period, filters.zThreshold]);

  const clearFlashLater = useCallback((id: string) => {
    if (flashTimers.current[id]) clearTimeout(flashTimers.current[id]);
    flashTimers.current[id] = setTimeout(() => {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, flash: null } : r)));
      delete flashTimers.current[id];
    }, 1600);
  }, []);

  useEffect(() => {
    const unsub = subscribeToTable(
      'flow_snapshots',
      (payload: any) => {
        const row = payload.new as FlowSnapshot;
        if (!row) return;
        const f = filtersRef.current;
        if (!matchesFilters(row, f)) return;
        const z = row.z_score ?? 0;
        const flash: AnomalyRow['flash'] = isAnomaly(z, f.zThreshold)
          ? z >= Z_CRITICAL
            ? 'red'
            : 'green'
          : null;
        setUsingExamples(false);
        setRows((prev) => {
          const without = prev.filter((p) => p.id !== row.id);
          return [{ ...row, flash }, ...without].slice(0, 300);
        });
        if (flash) clearFlashLater(row.id);
        setConnection('online');
      },
      { event: '*' }
    );
    return () => {
      unsub();
      Object.values(flashTimers.current).forEach(clearTimeout);
      flashTimers.current = {};
    };
  }, [clearFlashLater]);

  // Cleanup selection when rows shrink.
  useEffect(() => {
    setSelectedIndex((i) => (i >= rows.length ? rows.length - 1 : i));
  }, [rows.length]);

  const filtered = useMemo(
    () => sortRows(rows.filter((r) => matchesFilters(r, filters)), filters.sortKey),
    [rows, filters]
  );

  const baselineRows = useMemo(() => {
    // Last few flagged events to keep the deck alive; examples are clearly labeled upstream.
    const source = rows.length ? rows : SAMPLE_SNAPSHOTS;
    return [...source]
      .filter((r) => (r.z_score ?? 0) >= 3.0)
      .sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 5);
  }, [rows]);

  const maxInflow = useMemo(
    () =>
      filtered.reduce((m, r) => Math.max(m, Math.abs(r.net_inflow_usd ?? 0)), 0),
    [filtered]
  );

  return {
    rows: filtered,
    baselineRows,
    loading,
    error,
    connection,
    isEmpty: filtered.length === 0,
    usingExamples,
    baselineCopy: {
      noAnomalyMsg: BASELINE.noAnomalyMsg,
      baselineInflow: BASELINE.baselineInflow,
    },
    maxInflow,
    selectedIndex,
    setSelectedIndex,
    refresh: load,
  };
}
