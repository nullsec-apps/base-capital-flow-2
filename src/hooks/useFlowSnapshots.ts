import { useState, useEffect, useCallback, useRef } from 'react';
import { TABLES, supabase } from '../lib/supabaseClient';
import { subscribeToTable } from '../lib/supabase';
import { periodCutoff, type useFilters } from './useFilters';
import type { FilterState, FlowSnapshot, ConnectionState } from '../types';

type Filters = ReturnType<typeof useFilters>['filters'];

interface FlowSnapshotsResult {
  snapshots: FlowSnapshot[];
  loading: boolean;
  error: string | null;
  connection: ConnectionState;
  refresh: () => void;
  maxInflow: number;
}

function sortSnapshots(rows: FlowSnapshot[], key: FilterState['sortKey']): FlowSnapshot[] {
  const arr = [...rows];
  switch (key) {
    case 'inflow':
      arr.sort((a, b) => (b.net_inflow_usd ?? 0) - (a.net_inflow_usd ?? 0));
      break;
    case 'zscore':
      arr.sort((a, b) => (b.z_score ?? 0) - (a.z_score ?? 0));
      break;
    case 'buyers':
      arr.sort((a, b) => (b.unique_buyers ?? 0) - (a.unique_buyers ?? 0));
      break;
    case 'recency':
    default:
      arr.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }
  return arr;
}

function applyClientFilters(rows: FlowSnapshot[], filters: Filters): FlowSnapshot[] {
  return rows.filter((r) => {
    const inflow = r.net_inflow_usd ?? 0;
    if (inflow < filters.amountMin) return false;
    if (filters.amountMax > 0 && inflow > filters.amountMax) return false;
    if (filters.contractType !== 'all') {
      const t = (r.contract_type ?? 'other').toLowerCase();
      if (t !== filters.contractType) return false;
    }
    if (filters.verifiedOnly && !r.verified) return false;
    if (filters.tokenAddress && r.token_address !== filters.tokenAddress) return false;
    return true;
  });
}

/**
 * Parameterized fetch of flow snapshots for the center feed table.
 * Merges realtime INSERT/UPDATE events. Never fabricates data.
 */
export function useFlowSnapshots(filters: Filters): FlowSnapshotsResult {
  const [snapshots, setSnapshots] = useState<FlowSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<ConnectionState>('connecting');
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cutoff = periodCutoff(filtersRef.current.period);
      const { data, error: qErr } = await supabase
        .from(TABLES.flowSnapshots())
        .select('*')
        .gte('created_at', cutoff)
        .order('created_at', { ascending: false })
        .limit(300);
      if (qErr) {
        const msg = (qErr.message || '').toLowerCase();
        if (msg.includes('does not exist')) {
          setSnapshots([]);
          setConnection('online');
          return;
        }
        throw qErr;
      }
      setSnapshots((data as FlowSnapshot[]) ?? []);
      setConnection('online');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'feed unavailable');
      setConnection('error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, filters.period]);

  useEffect(() => {
    const unsub = subscribeToTable(
      'flow_snapshots',
      (payload: any) => {
        const row = payload.new as FlowSnapshot;
        if (!row) return;
        setSnapshots((prev) => {
          const idx = prev.findIndex((s) => s.id === row.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...row };
            return next;
          }
          return [row, ...prev].slice(0, 300);
        });
        setConnection('online');
      },
      { event: '*' }
    );
    return unsub;
  }, []);

  const filtered = sortSnapshots(
    applyClientFilters(snapshots, filters),
    filters.sortKey
  );
  const maxInflow = filtered.reduce(
    (m, r) => Math.max(m, Math.abs(r.net_inflow_usd ?? 0)),
    0
  );

  return {
    snapshots: filtered,
    loading,
    error,
    connection,
    refresh: load,
    maxInflow,
  };
}
