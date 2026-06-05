import { formatDistanceToNowStrict } from 'date-fns';

/** Compact USD: $182K, $1.2M, $3.4B. Null-safe. */
export function usdCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs < 1000) return `${sign}$${abs.toFixed(0)}`;
  if (abs < 1_000_000) return `${sign}$${(abs / 1000).toFixed(abs < 10_000 ? 1 : 0)}K`;
  if (abs < 1_000_000_000) return `${sign}$${(abs / 1_000_000).toFixed(abs < 10_000_000 ? 2 : 1)}M`;
  return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
}

/** Signed compact USD with explicit + for positive inflow. */
export function usdSigned(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const base = usdCompact(Math.abs(value));
  if (value > 0) return `+${base}`;
  if (value < 0) return `-${base}`;
  return base;
}

/** Compact integer count: 1.2K, 18, 3.4M. */
export function countCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const abs = Math.abs(value);
  if (abs < 1000) return `${Math.round(value)}`;
  if (abs < 1_000_000) return `${(value / 1000).toFixed(1)}K`;
  return `${(value / 1_000_000).toFixed(1)}M`;
}

/** Truncated address: 0x4f3a...a1c2 -> 0x4f..a1 (short) */
export function truncAddress(address: string | null | undefined, short = true): string {
  if (!address) return '—';
  if (address.length < 10) return address;
  if (short) return `${address.slice(0, 4)}..${address.slice(-2)}`;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/** Relative time: 12s, 4m, 2h, 3d. Null-safe. */
export function relTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  try {
    return formatDistanceToNowStrict(d, { addSuffix: false })
      .replace(' seconds', 's')
      .replace(' second', 's')
      .replace(' minutes', 'm')
      .replace(' minute', 'm')
      .replace(' hours', 'h')
      .replace(' hour', 'h')
      .replace(' days', 'd')
      .replace(' day', 'd')
      .replace(/\s/g, '');
  } catch {
    return '—';
  }
}

/** Clock time HH:MM:SS for the running terminal feel. */
export function clockTime(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return '--:--:--';
  return d.toLocaleTimeString('en-GB', { hour12: false });
}

/** Fixed-decimal z-score: 4.7 */
export function fmtZ(z: number | null | undefined): string {
  if (z === null || z === undefined || Number.isNaN(z)) return '—';
  return z.toFixed(1);
}

/** Percentage with 1 decimal, null-safe. */
export function fmtPct(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${(value * 100).toFixed(1)}%`;
}

/** Fixed-width pad for non-shifting tabular figures. */
export function padNum(text: string, width: number): string {
  return text.padStart(width, ' ');
}

/** Price with adaptive precision for low-cap tokens. */
export function usdPrice(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  if (value === 0) return '$0';
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toPrecision(2)}`;
}
