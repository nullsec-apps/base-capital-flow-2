import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, ArrowUpRight, Activity } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useFlowTape } from '../hooks/useFlowTape';
import { MagnitudeBar } from './MagnitudeBar';
import { ZScoreChip } from './ZScoreChip';
import { usdSigned, truncAddress, relTime } from '../lib/format';
import { isAnomaly, Z_CRITICAL, zStyle } from '../lib/zscore';
import { SAMPLE_SNAPSHOTS } from '../lib/sampleData';
import { cn } from '../lib/utils';
import type { TapeItem } from '../hooks/useFlowTape';

interface FlowTapeProps {
  onSelectToken?: (address: string) => void;
  threshold?: number;
  className?: string;
}

/**
 * Signature horizontal auto-scrolling FLOW TAPE. Anomaly rows flash accent.
 * Pinned top on all viewports. Falls back to clearly-labeled example rows.
 */
export function FlowTape({ onSelectToken, threshold = 3.0, className }: FlowTapeProps) {
  const { items, loading } = useFlowTape(threshold);

  const showExamples = !loading && items.length === 0;
  const list: TapeItem[] = useMemo(() => {
    if (showExamples) {
      return SAMPLE_SNAPSHOTS.map((s) => ({ ...s, flash: null }));
    }
    return items;
  }, [items, showExamples]);

  const max = useMemo(
    () => Math.max(1, ...list.map((i) => Math.abs(i.net_inflow_usd ?? 0))),
    [list]
  );

  // duplicate for seamless marquee
  const doubled = useMemo(() => [...list, ...list], [list]);

  return (
    <div
      className={cn(
        'relative flex items-stretch border-b border-[#5E6E66]/25 bg-[#0A0C0B] overflow-hidden',
        className
      )}
    >
      {/* Label cap */}
      <div className="flex shrink-0 items-center gap-2 border-r border-[#5E6E66]/25 bg-[#121615] px-3 sm:px-4">
        <motion.span
          className="inline-block h-2 w-2 rounded-full bg-[#FF5C3D]"
          animate={{ opacity: [1, 0.25, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="font-display text-[10px] sm:text-xs tracking-[0.18em] text-[#3DFF8C]">
          FLOW TAPE
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-1 items-center gap-6 px-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2 animate-pulse">
              <div className="h-2.5 w-16 bg-[#5E6E66]/20" />
              <div className="h-2.5 w-12 bg-[#5E6E66]/20" />
            </div>
          ))}
        </div>
      )}

      {/* Tape track */}
      {!loading && (
        <div className="relative flex flex-1 items-center overflow-hidden">
          {showExamples && (
            <span className="absolute left-2 top-0.5 z-10 font-display text-[8px] tracking-[0.18em] text-[#5E6E66]">
              EXAMPLE
            </span>
          )}
          <TooltipProvider delayDuration={120}>
            <motion.div
              className="flex items-center whitespace-nowrap"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 38, repeat: Infinity, ease: 'linear' }}
            >
              {doubled.map((item, idx) => {
                const z = item.net_inflow_usd != null ? item.z_score ?? 0 : 0;
                const anomaly = isAnomaly(z, threshold);
                const critical = z >= Z_CRITICAL;
                const style = zStyle(z);
                const accent = critical ? '#FF5C3D' : '#3DFF8C';
                return (
                  <Tooltip key={`${item.id}-${idx}`}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onSelectToken?.(item.token_address)}
                        className={cn(
                          'group flex shrink-0 items-center gap-2 border-r border-[#5E6E66]/15 px-3 py-1.5 transition-colors duration-200 hover:bg-[#3DFF8C]/[0.05]',
                          anomaly && 'bg-[rgba(61,255,140,0.04)]'
                        )}
                      >
                        <span className="font-display text-[11px] text-[#E6F2EC] group-hover:text-[#3DFF8C] transition-colors">
                          {item.symbol ?? truncAddress(item.token_address)}
                        </span>
                        <span
                          className="tabular font-display text-[11px]"
                          style={{ color: (item.net_inflow_usd ?? 0) >= 0 ? '#3DFF8C' : '#FF5C3D' }}
                        >
                          {usdSigned(item.net_inflow_usd)}
                        </span>
                        <span className="w-10">
                          <MagnitudeBar
                            value={Math.abs(item.net_inflow_usd ?? 0)}
                            max={max}
                            color={accent}
                            flash={item.flash != null}
                            height={3}
                          />
                        </span>
                        {anomaly && (
                          <span
                            className="font-display text-[9px] tracking-[0.12em]"
                            style={{ color: style.color }}
                          >
                            {critical ? 'ANOMALY' : 'FLAG'}
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="no-radius border border-[#5E6E66]/40 bg-[#0A0C0B] font-display text-[11px]">
                      <div className="flex flex-col gap-1">
                        <span className="text-[#E6F2EC]">
                          {item.name ?? item.symbol ?? 'Unknown'} — {truncAddress(item.token_address, false)}
                        </span>
                        <div className="flex items-center gap-2">
                          <ZScoreChip z={item.z_score} showLabel />
                          <span className="text-[#5E6E66]">{relTime(item.created_at)} ago</span>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </motion.div>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}

export default FlowTape;
