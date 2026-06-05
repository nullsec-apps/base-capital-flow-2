const DEAD = '0x000000000000000000000000000000000000dEaD';

export function basescanToken(address: string): string {
  return `https://basescan.org/token/${address}`;
}

export function basescanAddress(address: string): string {
  return `https://basescan.org/address/${address}`;
}

export function basescanTx(hash: string): string {
  return `https://basescan.org/tx/${hash}`;
}

export function dexScreenerToken(address: string): string {
  return `https://dexscreener.com/base/${address}`;
}

export function dexScreenerSearch(query: string): string {
  return `https://dexscreener.com/base?q=${encodeURIComponent(query)}`;
}

/** Prefer a stored dex_url, otherwise derive from address. */
export function resolveDexUrl(address: string, dexUrl?: string | null): string {
  if (dexUrl && dexUrl.startsWith('http')) return dexUrl;
  return dexScreenerToken(address);
}

export function burnAddress(): string {
  return DEAD;
}
