import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Radio, Activity, Database, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSources } from '../hooks/useSources';
import { usdCompact, relTime } from '../lib/format';
import { cn } from '../lib/utils';
import type { SourceHealth } from '../hooks/useSources';

interface StatusBarProps {
  inflow24h: number;
  anomalyCount: number;
  className?: string;
}

const HEALTH_STYLE: Record<SourceHealth, { color: string; label: string }> = {
  healthy: { color: '#3DFF8C', label: 'LIVE' },
  stale: { color: '#FFC73D', label: 'STALE' },
  error: { color: '#FF5C3D', label: 'ERROR' },
  idle: { color: '#5E6E66', label: 'IDLE' },
};

function TickCounter({ value }: { value: number }) {
  return (
    <motion.span
      key={Math.round(value / 1000)}
      initial={{ opacity: 0.4, y: -2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="tabular font-display text-[#3DFF8C]"
    >
      {usdCompact(value)}
    </motion.span>
  );
}

/**
 * Top-bar status cluster: REC dot, 24h net inflow counter, active anomaly count,
 * data-source health, last ingest timestamp.
 */
export function StatusBar({ inflow24h, anomalyCount, className }: StatusBarProps) {
  const { sources, health, lastIngestAt, usingExamples, loading } = useSources();
  const hs = HEALTH_STYLE[health];

  const activeCount = useMemo(
    () => sources.filter((s) => (s.status || '').toLowerCase() !== 'error').length,
    [sources]
  );

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className={cn(
          'flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-1.5 sm:px-4 font-display text-[10px] sm:text-[11px]',
          className
        )}
      >
        {/* REC */}
        <div className="flex items-center gap-1.5">
          <motion.span
            className="inline-block h-2 w-2 rounded-full bg-[#FF5C3D]"
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="tracking-[0.18em] text-[#FF5C3D]">REC</span>
        </div>

        <Separator orientation="vertical" className="h-3 bg-[#5E6E66]/30" />

        {/* 24h inflow */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 cursor-default">
              <Activity size={12} strokeWidth={1.5} className="text-[#5E6E66]" />
              <span className="text-[#5E6E66] tracking-[0.1em]">24H NET</span>
              <TickCounter value={inflow24h} />
            </div>
          </TooltipTrigger>
          <TooltipContent className="no-radius border border-[#5E6E66]/40 bg-[#0A0C0B] font-display text-[11px]">
            Aggregate net positive inflow over the last 24h window
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-3 bg-[#5E6E66]/30" />

        {/* Anomalies */}
        <div className="flex items-center gap-1.5">
          <AlertTriangle
            size={12}
            strokeWidth={1.5}
            className={anomalyCount > 0 ? 'text-[#FFC73D]' : 'text-[#5E6E66]'}
          />
          <span className="text-[#5E6E66] tracking-[0.1em]">ANOM</span>
          <motion.span
            key={anomalyCount}
            initial={{ scale: 1.3, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={cn(
              'tabular font-display',
              anomalyCount > 0 ? 'text-[#FFC73D]' : 'text-[#5E6E66]'
            )}
          >
            {anomalyCount}
          </motion.span>
        </div>

        <Separator orientation="vertical" className="hidden h-3 bg-[#5E6E66]/30 sm:block" />

        {/* Source health */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 cursor-default">
              <Database size={12} strokeWidth={1.5} style={{ color: hs.color }} />
              <Badge
                variant="outline"
                className="no-radius border-[#5E6E66]/40 bg-transparent px-1.5 py-0 font-display text-[9px] tracking-[0.12em] transition-colors duration-200"
                style={{ color: hs.color, borderColor: `${hs.color}55` }}
              >
                {loading ? '...' : hs.label}
              </Badge>
              {usingExamples && (
                <span className="text-[9px] tracking-[0.1em] text-[#5E6E66]">EXAMPLE SRC</span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent className="no-radius border border-[#5E6E66]/40 bg-[#0A0C0B] font-display text-[11px]">
            {activeCount} source{activeCount === 1 ? '' : 's'} active
            {usingExamples ? ' — showing example sources until pipeline registers real ones' : ''}
          </TooltipContent>
        </Tooltip>

        {/* Last ingest */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 cursor-default">
              <Clock size={12} strokeWidth={1.5} className="text-[#5E6E66]" />
              <span className="tabular text-[#5E6E66]">
                {lastIngestAt ? `${relTime(lastIngestAt)} ago` : '—'}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="no-radius border border-[#5E6E66]/40 bg-[#0A0C0B] font-display text-[11px]">
            Last ingest timestamp
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export default StatusBar;
