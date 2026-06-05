import { useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, RefreshCw, Activity } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { MagnitudeBar } from './MagnitudeBar';
import { ZScoreChip } from './ZScoreChip';
import { EmptyState } from './EmptyState';
import { useAnomalyFeed } from '../hooks/useAnomalyFeed';
import { useFilters } from '../hooks/useFilters';
import { useKeyboardNav } from '../hooks/useKeyboardNav';
import { buildSparkline } from '../lib/sparkline';
import {
  usdSigned,
  usdCompact,
  countCompact,
  truncAddress,
  relTime,
} from '../lib/format';
import { Z_CRITICAL, zStyle } from '../lib/zscore';
import { cn } from '../lib/utils';
import type { AnomalyRow } from '../hooks/useAnomalyFeed';
import type { FlowSnapshot } from '../types';

interface FlowFeedTableProps {
  onSelectToken?: (snapshot: FlowSnapshot) => void;
  selectedId?: string | null;
  className?: string;
}

const COLS =
  'grid-cols-[88px_minmax(0,1fr)_96px_72px_88px] sm:grid-cols-[100px_minmax(0,1.3fr)_minmax(110px,1fr)_70px_64px_88px_64px]';

function Sparkline({ series, color }: { series?: number[]; color: string }) {
  const path = useMemo(() => buildSparkline(series, 64, 18), [series]);
  if (!path.line) {
    return <span className="tabular text-[9px] text-[#5E6E66]">—</span>;
  }
  return (
    <svg width={64} height={18} viewBox="0 0 64 18" className="overflow-visible">
      <path d={path.area} fill={color} fillOpacity={0.12} />
      <path d={path.line} fill="none" stroke={color} strokeWidth={1.2} />
      <circle cx={path.last[0]} cy={path.last[1]} r={1.4} fill={color} />
    </svg>
  );
}

export function FlowFeedTable({
  onSelectToken,
  selectedId,
  className,
}: FlowFeedTableProps) {
  const { filters } = useFilters();
  const {
    rows,
    baselineRows,
    loading,
    isEmpty,
    usingExamples,
    maxInflow,
    selectedIndex,
    setSelectedIndex,
    refresh,
  } = useAnomalyFeed(filters);
  const listRef = useRef<HTMLDivElement>(null);

  useKeyboardNav({
    count: rows.length,
    selectedIndex,
    onSelect: setSelectedIndex,
    onEnter: (i) => {
      const r = rows[i];
      if (r) onSelectToken?.(r);
    },
    onEscape: () => setSelectedIndex(-1),
  });

  // Scroll the selected row into view on keyboard nav.
  useEffect(() => {
    if (selectedIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-row-index="${selectedIndex}"]`
    );
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedIndex]);

  const handleSelect = (r: AnomalyRow, i: number) => {
    setSelectedIndex(i);
    onSelectToken?.(r);
  };

  return (
    <div className={cn('flex h-full min-h-0 flex-col bg-[#0A0C0B]', className)}>
      <div className="flex items-center justify-between border-b border-[#5E6E66]/15 px-3 py-2.5">
        <span className="flex items-center gap-2 font-display text-[11px] tracking-[0.16em] text-[#E6F2EC]">
          <Activity size={14} strokeWidth={1.5} className="text-[#3DFF8C]" />
          ANOMALY FEED
          <span className="tabular text-[10px] text-[#5E6E66]">
            {rows.length} flagged
          </span>
          {usingExamples && !isEmpty && (
            <Badge className="no-radius border-[#5E6E66]/40 bg-transparent px-1.5 py-0 font-display text-[9px] tracking-[0.12em] text-[#5E6E66]">
              EXAMPLE
            </Badge>
          )}
        </span>
        <button
          type="button"
          onClick={refresh}
          className="text-[#5E6E66] transition-colors duration-200 hover:text-[#3DFF8C]"
          aria-label="refresh feed"
        >
          <RefreshCw size={13} className={cn(loading && 'animate-spin')} />
        </button>
      </div>

      {/* Header row */}
      <div
        className={cn(
          'grid items-center gap-2 border-b border-[#5E6E66]/15 px-3 py-1.5 font-display text-[9px] tracking-[0.14em] text-[#5E6E66]',
          COLS
        )}
      >
        <span>Z-SCORE</span>
        <span>CONTRACT</span>
        <span className="hidden sm:block">MAGNITUDE</span>
        <span className="text-right">INFLOW</span>
        <span className="hidden text-right sm:block">BUYERS</span>
        <span className="hidden text-right sm:block">TREND</span>
        <span className="text-right">AGE</span>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div ref={listRef} className="flex flex-col">
          {loading && rows.length === 0 ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={cn('grid items-center gap-2 px-3 py-3', COLS)}
              >
                <Skeleton className="h-4 w-14 bg-[#5E6E66]/10" />
                <Skeleton className="h-3 w-24 bg-[#5E6E66]/10" />
                <Skeleton className="hidden h-1.5 w-full bg-[#5E6E66]/10 sm:block" />
                <Skeleton className="h-3 w-14 justify-self-end bg-[#5E6E66]/10" />
                <Skeleton className="hidden h-3 w-10 justify-self-end bg-[#5E6E66]/10 sm:block" />
                <Skeleton className="hidden h-3 w-12 justify-self-end bg-[#5E6E66]/10 sm:block" />
                <Skeleton className="h-3 w-8 justify-self-end bg-[#5E6E66]/10" />
              </div>
            ))
          ) : isEmpty ? (
            <div className="p-4">
              <EmptyState
                threshold={filters.zThreshold}
                period={filters.period}
                lastFlagged={baselineRows}
                onSelectToken={(addr) => {
                  const r =
                    baselineRows.find((b) => b.token_address === addr) || null;
                  if (r) onSelectToken?.(r);
                }}
              />
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {rows.map((r, i) => {
                const z = r.z_score ?? 0;
                const critical = z >= Z_CRITICAL;
                const style = zStyle(z);
                const accent = critical ? '#FF5C3D' : '#3DFF8C';
                const isSelected =
                  selectedId === r.id || selectedIndex === i;
                return (
                  <TooltipProvider key={r.id} delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.button
                          type="button"
                          data-row-index={i}
                          layout
                          initial={{
                            opacity: 0,
                            backgroundColor: r.flash
                              ? r.flash === 'red'
                                ? 'rgba(255,92,61,0.18)'
                                : 'rgba(61,255,140,0.16)'
                              : 'rgba(0,0,0,0)',
                          }}
                          animate={{
                            opacity: 1,
                            backgroundColor: isSelected
                              ? 'rgba(61,255,140,0.07)'
                              : 'rgba(0,0,0,0)',
                          }}
                          transition={{ duration: 0.5 }}
                          onClick={() => handleSelect(r, i)}
                          className={cn(
                            'group grid w-full items-center gap-2 border-b border-[#5E6E66]/10 px-3 py-2.5 text-left transition-colors duration-200 hover:bg-[#3DFF8C]/[0.05]',
                            COLS,
                            isSelected &&
                              'border-l-2 border-l-[#3DFF8C] pl-[10px]'
                          )}
                        >
                          <span>
                            <ZScoreChip z={r.z_score} compact />
                          </span>
                          <span className="min-w-0">
                            <span
                              className={cn(
                                'block truncate font-display text-xs transition-colors duration-200',
                                isSelected ? 'text-[#3DFF8C]' : 'text-[#E6F2EC]'
                              )}
                            >
                              {r.symbol || truncAddress(r.token_address)}
                            </span>
                            <span className="tabular block truncate text-[9px] text-[#5E6E66]">
                              {truncAddress(r.token_address)}
                            </span>
                          </span>
                          <span className="hidden min-w-0 sm:block">
                            <MagnitudeBar
                              value={Math.abs(r.net_inflow_usd ?? 0)}
                              max={maxInflow}
                              color={accent}
                              flash={!!r.flash}
                              height={4}
                            />
                          </span>
                          <span
                            className="tabular justify-self-end font-display text-xs"
                            style={{ color: style.color }}
                          >
                            {usdSigned(r.net_inflow_usd)}
                          </span>
                          <span className="tabular hidden justify-self-end font-display text-[11px] text-[#5E6E66] sm:block">
                            {countCompact(r.unique_buyers)}
                          </span>
                          <span className="hidden justify-self-end sm:block">
                            <Sparkline series={r.series} color={accent} />
                          </span>
                          <span className="tabular flex items-center justify-end gap-1 justify-self-end text-[10px] text-[#5E6E66]">
                            {relTime(r.created_at)}
                            <ArrowUpRight
                              size={11}
                              className="opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                            />
                          </span>
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="left"
                        className="no-radius max-w-[240px] border-[#5E6E66]/40 bg-[#0A0C0B] font-display text-[10px] text-[#E6F2EC]"
                      >
                        <span className="tabular block text-[#5E6E66]">
                          {truncAddress(r.token_address, false)}
                        </span>
                        <span className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5">
                          <span className="text-[#5E6E66]">INFLOW</span>
                          <span className="tabular text-right text-[#3DFF8C]">
                            {usdCompact(r.inflow_usd)}
                          </span>
                          <span className="text-[#5E6E66]">OUTFLOW</span>
                          <span className="tabular text-right">
                            {usdCompact(r.outflow_usd)}
                          </span>
                          <span className="text-[#5E6E66]">LIQUIDITY</span>
                          <span className="tabular text-right">
                            {usdCompact(r.liquidity_usd)}
                          </span>
                          <span className="text-[#5E6E66]">TX</span>
                          <span className="tabular text-right">
                            {countCompact(r.tx_count)}
                          </span>
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default FlowFeedTable;
