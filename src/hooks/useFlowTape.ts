import { useState, useEffect, useRef, useCallback } from 'react';
import { TABLES, supabase } from '../lib/supabaseClient';
import { subscribeToTable } from '../lib/supabase';
import { isAnomaly, Z_CRITICAL } from '../lib/zscore';
import type { FlowSnapshot, ConnectionState } from '../types';

export interface TapeItem extends FlowSnapshot {
  /** transient flash flag set on first realtime appearance */
  flash?: 'green' | 'red' | null;
}

interface FlowTapeResult {
  items: TapeItem[];
  loading: boolean;
  connection: ConnectionState;
  inflow24h: number;
  anomalyCount: number;
  refresh: () => void;
}

const BUFFER = 30;

/**
 * Rolling buffer of latest inflows for the signature FLOW TAPE.
 * Subscribes to realtime INSERT/UPDATE and flags anomaly flashes.
 */
export function useFlowTape(threshold = 3.0): FlowTapeResult {
  const [items, setItems] = useState<TapeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState<ConnectionState>('connecting');
  const flashTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(TABLES.flowSnapshots())
        .select('*')
        .order('created_at', { ascending: false })
        .limit(BUFFER);
      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('does not exist')) {
          setItems([]);
          setConnection('online');
          return;
        }
        setConnection('error');
        return;
      }
      setItems(((data as FlowSnapshot[]) ?? []).map((d) => ({ ...d, flash: null })));
      setConnection('online');
    } catch {
      setConnection('error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const clearFlashLater = useCallback((id: string) => {
    if (flashTimers.current[id]) clearTimeout(flashTimers.current[id]);
    flashTimers.current[id] = setTimeout(() => {
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, flash: null } : it))
      );
      delete flashTimers.current[id];
    }, 1600);
  }, []);

  useEffect(() => {
    const unsub = subscribeToTable(
      'flow_snapshots',
      (payload: any) => {
        const row = payload.new as FlowSnapshot;
        if (!row) return;
        const z = row.z_score ?? 0;
        const flash: TapeItem['flash'] = isAnomaly(z, threshold)
          ? z >= Z_CRITICAL
            ? 'red'
            : 'green'
          : null;
        setItems((prev) => {
          const without = prev.filter((p) => p.id !== row.id);
          const next = [{ ...row, flash }, ...without].slice(0, BUFFER);
          return next;
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
  }, [threshold, clearFlashLater]);

  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const inflow24h = items
    .filter((i) => new Date(i.created_at).getTime() >= dayAgo)
    .reduce((sum, i) => sum + Math.max(0, i.net_inflow_usd ?? 0), 0);
  const anomalyCount = items.filter((i) => isAnomaly(i.z_score, threshold)).length;

  return { items, loading, connection, inflow24h, anomalyCount, refresh: load };
}
