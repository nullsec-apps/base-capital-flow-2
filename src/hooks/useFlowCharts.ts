import { useState, useEffect, useCallback } from 'react';
import { TABLES, supabase } from '../lib/supabaseClient';
import { periodCutoff } from './useFilters';
import { meanStd, Z_MEDIUM } from '../lib/zscore';
import type { FlowSnapshot, TimePeriod, ConnectionState } from '../types';

export interface ChartPoint {
  t: number;
  iso: string;
  netInflow: number;
  z: number | null;
  anomaly: boolean;
}

export interface ChartSeries {
  points: ChartPoint[];
  mean: number;
  std: number;
  upperBand: number;
  lowerBand: number;
  anomalyCount: number;
}

export interface AggregatePoint {
  iso: string;
  t: number;
  totalInflow: number;
  anomalies: number;
}

interface FlowChartsResult {
  series: ChartSeries;
  aggregate: AggregatePoint[];
  loading: boolean;
  error: string | null;
  connection: ConnectionState;
  refresh: () => void;
}

const EMPTY_SERIES: ChartSeries = {
  points: [],
  mean: 0,
  std: 0,
  upperBand: 0,
  lowerBand: 0,
  anomalyCount: 0,
};

function buildSeries(rows: FlowSnapshot[]): ChartSeries {
  if (!rows.length) return EMPTY_SERIES;
  const ordered = [...rows].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const values = ordered.map((r) => r.net_inflow_usd ?? 0);
  const { mean, std } = meanStd(values);
  const points: ChartPoint[] = ordered.map((r) => {
    const z = r.z_score ?? null;
    return {
      t: new Date(r.created_at).getTime(),
      iso: r.created_at,
      netInflow: r.net_inflow_usd ?? 0,
      z,
      anomaly: (z ?? 0) >= Z_MEDIUM,
    };
  });
  return {
    points,
    mean,
    std,
    upperBand: mean + std * 2,
    lowerBand: Math.max(0, mean - std * 2),
    anomalyCount: points.filter((p) => p.anomaly).length,
  };
}

function bucketSizeMs(period: TimePeriod): number {
  switch (period) {
    case '15m':
      return 60 * 1000;
    case '1h':
      return 5 * 60 * 1000;
    case '24h':
      return 60 * 60 * 1000;
    case '7d':
      return 6 * 60 * 60 * 1000;
    default:
      return 5 * 60 * 1000;
  }
}

function buildAggregate(rows: FlowSnapshot[], period: TimePeriod): AggregatePoint[] {
  if (!rows.length) return [];
  const size = bucketSizeMs(period);
  const buckets = new Map<number, { total: number; anomalies: number }>();
  for (const r of rows) {
    const t = new Date(r.created_at).getTime();
    const key = Math.floor(t / size) * size;
    const cur = buckets.get(key) ?? { total: 0, anomalies: 0 };
    cur.total += Math.max(0, r.net_inflow_usd ?? 0);
    if ((r.z_score ?? 0) >= Z_MEDIUM) cur.anomalies += 1;
    buckets.set(key, cur);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, v]) => ({
      t,
      iso: new Date(t).toISOString(),
      totalInflow: v.total,
      anomalies: v.anomalies,
    }));
}

/**
 * Time-series datasets for FlowChart (per-token) and ChartsView (aggregate).
 * Computes baseline mean/std bands + anomaly markers. Period-aware.
 */
export function useFlowCharts(
  period: TimePeriod,
  tokenAddress?: string | null
): FlowChartsResult {
  const [series, setSeries] = useState<ChartSeries>(EMPTY_SERIES);
  const [aggregate, setAggregate] = useState<AggregatePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<ConnectionState>('connecting');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cutoff = periodCutoff(period);
      let q = supabase
        .from(TABLES.flowSnapshots())
        .select('*')
        .gte('created_at', cutoff)
        .order('created_at', { ascending: true })
        .limit(1000);
      if (tokenAddress) q = q.eq('token_address', tokenAddress);
      const { data, error: qErr } = await q;
      if (qErr) {
        const msg = (qErr.message || '').toLowerCase();
        if (msg.includes('does not exist')) {
          setSeries(EMPTY_SERIES);
          setAggregate([]);
          setConnection('online');
          return;
        }
        throw qErr;
      }
      const rows = (data as FlowSnapshot[]) ?? [];
      setSeries(buildSeries(rows));
      setAggregate(buildAggregate(rows, period));
      setConnection('online');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'chart data unavailable');
      setConnection('error');
    } finally {
      setLoading(false);
    }
  }, [period, tokenAddress]);

  useEffect(() => {
    load();
  }, [load]);

  return { series, aggregate, loading, error, connection, refresh: load };
}
