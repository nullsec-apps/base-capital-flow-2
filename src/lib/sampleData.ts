import type { Alert, FlowSnapshot, Source, TrackedToken } from '../types';
import { seededRandom } from './utils';

/**
 * CLEARLY-LABELED example data for the hero + pre-pipeline empty states.
 * Every record carries isExample so the UI can mark it as a placeholder.
 * These are NEVER persisted or shown as real live anomalies.
 */

function series(seed: string, n = 14, base = 40000, spike = 3): number[] {
  const out: number[] = [];
  let v = base;
  for (let i = 0; i < n; i++) {
    const r = seededRandom(`${seed}-${i}`);
    v = Math.max(1000, v * (0.85 + r * 0.45));
    if (i === n - 1) v *= spike;
    out.push(Math.round(v));
  }
  return out;
}

const now = Date.now();
function ago(sec: number): string {
  return new Date(now - sec * 1000).toISOString();
}

/** Example FLOW TAPE / feed rows referenced in the design proof module. */
export const SAMPLE_SNAPSHOTS: FlowSnapshot[] = [
  {
    id: 'ex-1',
    token_address: '0x4f3a000000000000000000000000000000000a1c',
    net_inflow_usd: 182000,
    inflow_usd: 198000,
    outflow_usd: 16000,
    unique_buyers: 214,
    tx_count: 487,
    market_cap: 1240000,
    fdv: 1800000,
    volume_24h: 540000,
    volume_to_market_cap: 0.435,
    liquidity_usd: 96000,
    price_usd: 0.0123,
    z_score: 4.7,
    window_minutes: 15,
    dex_url: null,
    raw: null,
    created_at: ago(42),
    symbol: 'PULSE',
    name: 'Pulse Protocol',
    contract_type: 'token',
    verified: true,
    series: series('ex-1', 14, 38000, 3.1),
    isExample: true,
  },
  {
    id: 'ex-2',
    token_address: '0x9c2e0000000000000000000000000000000003ee',
    net_inflow_usd: 61000,
    inflow_usd: 71000,
    outflow_usd: 10000,
    unique_buyers: 88,
    tx_count: 142,
    market_cap: 640000,
    fdv: 920000,
    volume_24h: 180000,
    volume_to_market_cap: 0.281,
    liquidity_usd: 54000,
    price_usd: 0.0041,
    z_score: 2.1,
    window_minutes: 15,
    dex_url: null,
    raw: null,
    created_at: ago(96),
    symbol: 'GRID',
    name: 'Gridline',
    contract_type: 'token',
    verified: true,
    series: series('ex-2', 14, 22000, 1.6),
    isExample: true,
  },
  {
    id: 'ex-3',
    token_address: '0xab77000000000000000000000000000000007700',
    net_inflow_usd: 340000,
    inflow_usd: 372000,
    outflow_usd: 32000,
    unique_buyers: 401,
    tx_count: 933,
    market_cap: 2100000,
    fdv: 3100000,
    volume_24h: 1280000,
    volume_to_market_cap: 0.609,
    liquidity_usd: 210000,
    price_usd: 0.087,
    z_score: 6.9,
    window_minutes: 15,
    dex_url: null,
    raw: null,
    created_at: ago(18),
    symbol: 'VECTR',
    name: 'Vector Finance',
    contract_type: 'token',
    verified: true,
    series: series('ex-3', 14, 70000, 4.2),
    isExample: true,
  },
  {
    id: 'ex-4',
    token_address: '0x1d44000000000000000000000000000000004411',
    net_inflow_usd: 27000,
    inflow_usd: 33000,
    outflow_usd: 6000,
    unique_buyers: 41,
    tx_count: 77,
    market_cap: 310000,
    fdv: 410000,
    volume_24h: 88000,
    volume_to_market_cap: 0.283,
    liquidity_usd: 31000,
    price_usd: 0.00091,
    z_score: 3.4,
    window_minutes: 15,
    dex_url: null,
    raw: null,
    created_at: ago(210),
    symbol: 'NODE',
    name: 'Node Labs',
    contract_type: 'token',
    verified: false,
    series: series('ex-4', 14, 12000, 2.0),
    isExample: true,
  },
  {
    id: 'ex-5',
    token_address: '0x77be00000000000000000000000000000000be77',
    net_inflow_usd: 14000,
    inflow_usd: 19000,
    outflow_usd: 5000,
    unique_buyers: 22,
    tx_count: 39,
    market_cap: 180000,
    fdv: 240000,
    volume_24h: 42000,
    volume_to_market_cap: 0.233,
    liquidity_usd: 19000,
    price_usd: 0.00037,
    z_score: 3.1,
    window_minutes: 15,
    dex_url: null,
    raw: null,
    created_at: ago(330),
    symbol: 'FLUX',
    name: 'Fluxchain',
    contract_type: 'token',
    verified: true,
    series: series('ex-5', 14, 8000, 1.9),
    isExample: true,
  },
];

export const SAMPLE_ALERTS: Alert[] = [
  {
    id: 'exa-1',
    token_address: '0xab77000000000000000000000000000000007700',
    symbol: 'VECTR',
    z_score: 6.9,
    severity: 'critical',
    net_inflow_usd: 340000,
    window_minutes: 15,
    message: 'Critical inflow spike — z=6.9 over 15m baseline',
    context: null,
    created_at: ago(18),
    isExample: true,
  },
  {
    id: 'exa-2',
    token_address: '0x4f3a000000000000000000000000000000000a1c',
    symbol: 'PULSE',
    z_score: 4.7,
    severity: 'high',
    net_inflow_usd: 182000,
    window_minutes: 15,
    message: 'High inflow spike — z=4.7 over 15m baseline',
    context: null,
    created_at: ago(42),
    isExample: true,
  },
  {
    id: 'exa-3',
    token_address: '0x1d44000000000000000000000000000000004411',
    symbol: 'NODE',
    z_score: 3.4,
    severity: 'medium',
    net_inflow_usd: 27000,
    window_minutes: 15,
    message: 'Flagged inflow — z=3.4 over 15m baseline',
    context: null,
    created_at: ago(210),
    isExample: true,
  },
];

export const SAMPLE_TOKENS: TrackedToken[] = SAMPLE_SNAPSHOTS.map((s) => ({
  id: `ext-${s.id}`,
  token_address: s.token_address,
  name: s.name ?? null,
  symbol: s.symbol ?? null,
  contract_type: s.contract_type ?? 'token',
  verified: !!s.verified,
  dex_url: null,
  website_url: null,
  first_seen_at: s.created_at,
  last_verified_at: s.created_at,
  metadata: null,
  created_at: s.created_at,
}));

export const SAMPLE_SOURCES: Source[] = [
  {
    id: 'exs-1',
    name: 'BASE RPC (Alchemy)',
    kind: 'rpc',
    url: 'https://mainnet.base.org',
    status: 'example',
    last_run_at: ago(20),
    config: null,
    created_at: ago(86400),
  },
  {
    id: 'exs-2',
    name: 'DexScreener Base',
    kind: 'enrichment',
    url: 'https://api.dexscreener.com',
    status: 'example',
    last_run_at: ago(35),
    config: null,
    created_at: ago(86400),
  },
];

/** Baseline copy for never-blank empty states. */
export const BASELINE = {
  noAnomalyMsg: 'No anomalies above z=3.0 in last 15m.',
  baselineInflow: 'Baseline net inflow: $1.2M/hr',
} as const;

/** Aggregate 24h example inflow used by the hero counter before real data. */
export const SAMPLE_24H_INFLOW = 4_820_000;
