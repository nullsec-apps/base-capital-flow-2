/**
 * Inline SVG sparkline path generation from a recent inflow series.
 * Pure, deterministic, null-safe — no fabricated data.
 */

export interface SparkPath {
  /** SVG path 'd' for the line */
  line: string;
  /** SVG path 'd' for a filled area to the baseline */
  area: string;
  /** normalized last point [x,y] for an end-dot */
  last: [number, number];
  /** true if series is flat / single point */
  flat: boolean;
}

/**
 * Build a sparkline path for a fixed viewBox (default 100x28).
 * Returns empty paths when there is insufficient data.
 */
export function buildSparkline(
  series: number[] | null | undefined,
  width = 100,
  height = 28,
  pad = 2
): SparkPath {
  const empty: SparkPath = { line: '', area: '', last: [0, 0], flat: true };
  if (!series || series.length === 0) return empty;

  const data = series.filter((n) => Number.isFinite(n));
  if (data.length === 0) return empty;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const flat = max - min === 0;

  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const n = data.length;

  const points: [number, number][] = data.map((v, i) => {
    const x = pad + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const y = pad + innerH - ((v - min) / range) * innerH;
    return [x, y];
  });

  const line = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ');

  const first = points[0];
  const lastPt = points[points.length - 1];
  const baselineY = height - pad;
  const area =
    `M${first[0].toFixed(2)},${baselineY.toFixed(2)} ` +
    points.map(([x, y]) => `L${x.toFixed(2)},${y.toFixed(2)}`).join(' ') +
    ` L${lastPt[0].toFixed(2)},${baselineY.toFixed(2)} Z`;

  return { line, area, last: lastPt, flat };
}

/**
 * Trend direction of a series: 1 up, -1 down, 0 flat.
 */
export function sparkTrend(series: number[] | null | undefined): 1 | -1 | 0 {
  if (!series || series.length < 2) return 0;
  const a = series[0];
  const b = series[series.length - 1];
  if (b > a) return 1;
  if (b < a) return -1;
  return 0;
}
