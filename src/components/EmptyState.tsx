import { motion } from 'framer-motion';
import { Activity, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ZScoreChip } from './ZScoreChip';
import { usdSigned, usdCompact, truncAddress, relTime } from '../lib/format';
import { BASELINE, SAMPLE_SNAPSHOTS } from '../lib/sampleData';
import { cn } from '../lib/utils';
import type { FlowSnapshot } from '../types';

interface EmptyStateProps {
  threshold?: number;
  period?: string;
  lastFlagged?: FlowSnapshot[];
  onSelectToken?: (address: string) => void;
  className?: string;
}

/** Never-blank baseline state with faint historical flagged rows. */
export function EmptyState({
  threshold = 3.0,
  period = '15m',
  lastFlagged,
  onSelectToken,
  className,
}: EmptyStateProps) {
  const rows = (lastFlagged && lastFlagged.length ? lastFlagged : SAMPLE_SNAPSHOTS).slice(0, 5);
  const usingExamples = !lastFlagged || lastFlagged.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn('flex flex-col', className)}
    >
      <div className="flex flex-col items-start gap-3 border border-dashed border-[#5E6E66]/30 bg-[#121615]/60 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-[#5E6E66]">
          <Activity size={16} strokeWidth={1.5} className="text-[#3DFF8C]" />
          <span className="font-display text-[11px] tracking-[0.18em]">BASELINE STABLE</span>
        </div>
        <p className="font-display text-sm leading-relaxed text-[#E6F2EC] sm:text-base">
          No anomalies above{' '}
          <span className="text-[#3DFF8C]">z={threshold.toFixed(1)}</span> in last {period}.
        </p>
        <p className="text-xs leading-relaxed text-[#5E6E66]">
          Baseline net inflow holding at{' '}
          <span className="tabular text-[#E6F2EC]">
            {usdCompact(BASELINE.netInflowPerHour)}
          </span>
          /hr across {BASELINE.activeTokens} tracked contracts. The deck stays live — flagged
          events surface here the moment a z-score crosses threshold.
        </p>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <span className="font-display text-[10px] tracking-[0.2em] text-[#5E6E66]">
            LAST FLAGGED EVENTS
          </span>
          {usingExamples && (
            <Badge className="no-radius border-[#5E6E66]/40 bg-transparent font-display text-[9px] tracking-[0.14em] text-[#5E6E66]">
              EXAMPLE
            </Badge>
          )}
        </div>
        <Separator className="my-2 bg-[#5E6E66]/15" />
        <div className="flex flex-col">
          {rows.map((r, i) => (
            <motion.button
              key={r.id}
              type="button"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 0.55, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              whileHover={{ opacity: 1 }}
              onClick={() => onSelectToken?.(r.token_address)}
              className="group flex items-center gap-3 border-b border-[#5E6E66]/10 py-2.5 text-left transition-all duration-200 hover:bg-[#3DFF8C]/[0.04]"
            >
              <ZScoreChip z={r.z_score} compact />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-xs text-[#E6F2EC]">
                  {r.symbol || truncAddress(r.token_address)}
                </span>
                <span className="block tabular text-[10px] text-[#5E6E66]">
                  {truncAddress(r.token_address)}
                </span>
              </span>
              <span className="tabular font-display text-xs text-[#3DFF8C]">
                {usdSigned(r.net_inflow_usd)}
              </span>
              <span className="hidden tabular text-[10px] text-[#5E6E66] sm:inline">
                {relTime(r.created_at)}
              </span>
              <ArrowUpRight
                size={13}
                className="text-[#5E6E66] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              />
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default EmptyState;
