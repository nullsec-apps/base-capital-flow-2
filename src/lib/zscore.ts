import type { Severity } from '../types';

export const Z_MEDIUM = 3.0;
export const Z_HIGH = 4.0;
export const Z_CRITICAL = 6.0;

/** Classify a z-score into a severity bucket. */
export function classifySeverity(z: number | null | undefined): Severity | null {
  if (z === null || z === undefined || Number.isNaN(z)) return null;
  if (z >= Z_CRITICAL) return 'critical';
  if (z >= Z_HIGH) return 'high';
  if (z >= Z_MEDIUM) return 'medium';
  return null;
}

/** Is this z-score an anomaly above the configured threshold? */
export function isAnomaly(z: number | null | undefined, threshold = Z_MEDIUM): boolean {
  if (z === null || z === undefined || Number.isNaN(z)) return false;
  return z >= threshold;
}

export interface SeverityStyle {
  /** hex color for bars / glyphs */
  color: string;
  /** tailwind text class */
  text: string;
  /** tailwind border class */
  border: string;
  /** translucent background style value */
  bg: string;
  /** short label */
  label: string;
}

const GREEN = '#3DFF8C';
const AMBER = '#FFC73D';
const RED = '#FF5C3D';
const MUTED = '#5E6E66';

/** Map a severity (or null/below-threshold) to terminal color encoding. */
export function severityStyle(severity: Severity | null): SeverityStyle {
  switch (severity) {
    case 'critical':
      return {
        color: RED,
        text: 'text-[#FF5C3D]',
        border: 'border-[#FF5C3D]/50',
        bg: 'rgba(255,92,61,0.12)',
        label: 'ANOMALY',
      };
    case 'high':
      return {
        color: AMBER,
        text: 'text-[#FFC73D]',
        border: 'border-[#FFC73D]/50',
        bg: 'rgba(255,199,61,0.12)',
        label: 'HIGH',
      };
    case 'medium':
      return {
        color: GREEN,
        text: 'text-[#3DFF8C]',
        border: 'border-[#3DFF8C]/50',
        bg: 'rgba(61,255,140,0.12)',
        label: 'FLAG',
      };
    default:
      return {
        color: MUTED,
        text: 'text-[#5E6E66]',
        border: 'border-[#5E6E66]/40',
        bg: 'rgba(94,110,102,0.10)',
        label: 'BASE',
      };
  }
}

/** Derive style directly from a raw z-score value. */
export function zStyle(z: number | null | undefined): SeverityStyle {
  return severityStyle(classifySeverity(z));
}

/** Compute z-score for a value given a sample series (population). */
export function computeZ(value: number, series: number[]): number | null {
  if (!series.length) return null;
  const mean = series.reduce((a, b) => a + b, 0) / series.length;
  const variance =
    series.reduce((a, b) => a + (b - mean) * (b - mean), 0) / series.length;
  const std = Math.sqrt(variance);
  if (std === 0) return null;
  return (value - mean) / std;
}

/** Mean / std band for chart baseline rendering. */
export function meanStd(series: number[]): { mean: number; std: number } {
  if (!series.length) return { mean: 0, std: 0 };
  const mean = series.reduce((a, b) => a + b, 0) / series.length;
  const variance =
    series.reduce((a, b) => a + (b - mean) * (b - mean), 0) / series.length;
  return { mean, std: Math.sqrt(variance) };
}
