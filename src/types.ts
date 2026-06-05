export type Severity = 'medium' | 'high' | 'critical';

export interface FlowSnapshot {
  id: string;
  token_address: string;
  net_inflow_usd: number | null;
  inflow_usd: number | null;
  outflow_usd: number | null;
  unique_buyers: number | null;
  tx_count: number | null;
  market_cap: number | null;
  fdv: number | null;
  volume_24h: number | null;
  volume_to_market_cap: number | null;
  liquidity_usd: number | null;
  price_usd: number | null;
  z_score: number | null;
  window_minutes: number | null;
  dex_url: string | null;
  raw: Record<string, unknown> | null;
  created_at: string;
  symbol?: string | null;
  name?: string | null;
  contract_type?: string | null;
  verified?: boolean;
  series?: number[];
  isExample?: boolean;
}

export interface TrackedToken {
  id: string;
  token_address: string;
  name: string | null;
  symbol: string | null;
  contract_type: string | null;
  verified: boolean;
  dex_url: string | null;
  website_url: string | null;
  first_seen_at: string | null;
  last_verified_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Alert {
  id: string;
  token_address: string;
  symbol: string | null;
  z_score: number;
  severity: Severity;
  net_inflow_usd: number | null;
  window_minutes: number | null;
  message: string | null;
  context: Record<string, unknown> | null;
  created_at: string;
  isExample?: boolean;
}

export interface Source {
  id: string;
  name: string;
  kind: string;
  url: string | null;
  status: string;
  last_run_at: string | null;
  config: Record<string, unknown> | null;
  created_at: string;
}

export type ContractType = 'all' | 'token' | 'lp' | 'router' | 'other';
export type TimePeriod = '15m' | '1h' | '24h' | '7d';
export type SortKey = 'inflow' | 'zscore' | 'recency' | 'buyers';

export interface FilterState {
  amountMin: number;
  amountMax: number;
  period: TimePeriod;
  contractType: ContractType;
  zThreshold: number;
  verifiedOnly: boolean;
  sortKey: SortKey;
  tokenAddress: string | null;
}

export type ConnectionState = 'connecting' | 'online' | 'offline' | 'error';

export type MobileTab = 'feed' | 'charts' | 'alerts' | 'filters';
