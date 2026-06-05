const PROXY_URL = 'https://api.nullsec.studio/proxy';
const FETCH_URL = 'https://api.nullsec.studio/fetch-url';

function appId(): string {
  try {
    return (window as any).__NULLSEC__?.projectId ?? 'default';
  } catch {
    return 'default';
  }
}

export interface ProxyOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Server-side proxied request. Keeps any API keys server-side.
 * Returns parsed JSON or throws.
 */
export async function proxyRequest<T = unknown>(
  url: string,
  opts: ProxyOptions = {}
): Promise<T> {
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      method: opts.method ?? 'GET',
      body: opts.body,
      headers: opts.headers,
      appId: appId(),
    }),
  });
  if (!res.ok) {
    throw new Error(`proxy ${res.status}`);
  }
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

/** Fetch a public URL (with CORS handling) server-side. */
export async function fetchUrl<T = unknown>(url: string): Promise<T> {
  const res = await fetch(FETCH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, appId: appId() }),
  });
  if (!res.ok) throw new Error(`fetch-url ${res.status}`);
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export interface DexPair {
  chainId: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  priceUsd?: string;
  liquidity?: { usd?: number };
  volume?: { h24?: number };
  fdv?: number;
  marketCap?: number;
  url?: string;
}

/** DexScreener Base pair lookup (proxied to avoid CORS / centralize). */
export async function dexScreenerPairs(address: string): Promise<DexPair[]> {
  try {
    const data = await proxyRequest<{ pairs?: DexPair[] }>(
      `https://api.dexscreener.com/latest/dex/tokens/${address}`
    );
    const pairs = (data?.pairs ?? []).filter((p) => p.chainId === 'base');
    return pairs;
  } catch {
    return [];
  }
}

/** Verify a Base token and return the best (highest-liquidity) pair. */
export async function verifyBaseToken(address: string): Promise<DexPair | null> {
  const pairs = await dexScreenerPairs(address);
  if (!pairs.length) return null;
  return pairs.sort(
    (a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0)
  )[0];
}
