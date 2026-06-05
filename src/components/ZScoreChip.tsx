import { Badge } from '@/components/ui/badge';
import { zStyle } from '../lib/zscore';
import { fmtZ } from '../lib/format';
import { cn } from '../lib/utils';
import type { Severity } from '../types';

interface ZScoreChipProps {
  z: number | null | undefined;
  severity?: Severity | null;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Severity-encoded z-score pill. Green (3-4) -> amber (4-6) -> red (>=6).
 * Tabular monospace digits so figures never shift.
 */
export function ZScoreChip({
  z,
  size = 'sm',
  showLabel = false,
  compact = false,
  className,
}: ZScoreChipProps) {
  const style = zStyle(z);
  const isSm = size === 'sm' || compact;

  return (
    <Badge
      variant="outline"
      className={cn(
        'no-radius font-display tabular inline-flex items-center gap-1 transition-all duration-200',
        isSm ? 'px-1.5 py-0 text-[10px]' : 'px-2 py-0.5 text-xs',
        style.text,
        style.border,
        className
      )}
      style={{ backgroundColor: style.bg }}
    >
      <span className="leading-none">z={fmtZ(z)}</span>
      {showLabel && !compact && (
        <span className="leading-none opacity-80 tracking-[0.12em]">{style.label}</span>
      )}
    </Badge>
  );
}

export default ZScoreChip;
