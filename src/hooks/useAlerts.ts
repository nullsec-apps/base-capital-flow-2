import { useState, useEffect, useCallback, useRef } from 'react';
import { TABLES, supabase } from '../lib/supabaseClient';
import { subscribeToTable } from '../lib/supabase';
import { classifySeverity, Z_CRITICAL } from '../lib/zscore';
import type { Alert, ConnectionState, Severity } from '../types';

interface UseAlertsOptions {
  tokenAddress?: string | null;
  /** callback fired when a high-severity (z>=6) alert arrives */
  onHighSeverity?: (alert: Alert) => void;
}

interface AlertsResult {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  connection: ConnectionState;
  refresh: () => void;
  bySeverity: Record<Severity, number>;
}

const SEV_RANK: Record<Severity, number> = { medium: 1, high: 2, critical: 3 };

/**
 * Loads + realtime-subscribes app alerts. Dedupes by id, sorts by recency,
 * fires onHighSeverity for z>=6 events. Supports per-token filtering.
 */
export function useAlerts(opts: UseAlertsOptions = {}): AlertsResult {
  const { tokenAddress, onHighSeverity } = opts;
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<ConnectionState>('connecting');
  const seenRef = useRef<Set<string>>(new Set());
  const onHighRef = useRef(onHighSeverity);
  onHighRef.current = onHighSeverity;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from(TABLES.alerts())
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (tokenAddress) q = q.eq('token_address', tokenAddress);
      const { data, error: qErr } = await q;
      if (qErr) {
        const msg = (qErr.message || '').toLowerCase();
        if (msg.includes('does not exist')) {
          setAlerts([]);
          setConnection('online');
          return;
        }
        throw qErr;
      }
      const rows = (data as Alert[]) ?? [];
      rows.forEach((r) => seenRef.current.add(r.id));
      setAlerts(rows);
      setConnection('online');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'alerts unavailable');
      setConnection('error');
    } finally {
      setLoading(false);
    }
  }, [tokenAddress]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsub = subscribeToTable(
      'alerts',
      (payload: any) => {
        const row = payload.new as Alert;
        if (!row) return;
        if (tokenAddress && row.token_address !== tokenAddress) return;
        if (seenRef.current.has(row.id)) return;
        seenRef.current.add(row.id);
        setAlerts((prev) => [row, ...prev].slice(0, 100));
        setConnection('online');
        if ((row.z_score ?? 0) >= Z_CRITICAL && onHighRef.current) {
          onHighRef.current(row);
        }
      },
      { event: 'INSERT' }
    );
    return unsub;
  }, [tokenAddress]);

  const bySeverity = alerts.reduce(
    (acc, a) => {
      const sev = (a.severity as Severity) || classifySeverity(a.z_score) || 'medium';
      acc[sev] = (acc[sev] ?? 0) + 1;
      return acc;
    },
    { medium: 0, high: 0, critical: 0 } as Record<Severity, number>
  );

  const sorted = [...alerts].sort((a, b) => {
    const ta = new Date(a.created_at).getTime();
    const tb = new Date(b.created_at).getTime();
    if (tb !== ta) return tb - ta;
    return (SEV_RANK[b.severity as Severity] ?? 0) - (SEV_RANK[a.severity as Severity] ?? 0);
  });

  return { alerts: sorted, loading, error, connection, refresh: load, bySeverity };
}
