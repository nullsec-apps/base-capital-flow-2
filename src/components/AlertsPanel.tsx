import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, RefreshCw, ArrowRight, ShieldAlert, AlertTriangle, Flag } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAlerts } from '../hooks/useAlerts';
import { useFilters } from '../hooks/useFilters';
import { ZScoreChip } from './ZScoreChip';
import { severityStyle, classifySeverity } from '../lib/zscore';
import { usdSigned, truncAddress, relTime } from '../lib/format';
import { SAMPLE_ALERTS } from '../lib/sampleData';
import { cn } from '../lib/utils';
import type { Alert, Severity } from '../types';

interface AlertsPanelProps {
  onSelectToken?: (address: string) => void;
  className?: string;
}

function sevIcon(sev: Severity | null) {
  switch (sev) {
    case 'critical':
      return ShieldAlert;
    case 'high':
      return AlertTriangle;
    default:
      return Flag;
  }
}

export function AlertsPanel({ onSelectToken, className }: AlertsPanelProps) {
  const { filters, setZThreshold } = useFilters();
  const { alerts, loading, error, bySeverity, refresh } = useAlerts();

  const showExamples = !loading && alerts.length === 0;
  const list = showExamples ? SAMPLE_ALERTS : alerts;

  const counts = useMemo(() => {
    if (showExamples) {
      return SAMPLE_ALERTS.reduce(
        (acc, a) => {
          acc[a.severity] = (acc[a.severity] ?? 0) + 1;
          return acc;
        },
        { medium: 0, high: 0, critical: 0 } as Record<Severity, number>
      );
    }
    return bySeverity;
  }, [showExamples, bySeverity]);

  const thresholds = [3.0, 4.0, 6.0];

  return (
    <div
      className={cn(
        'flex h-full flex-col bg-[#121615] border border-[#5E6E66]/20',
        className
      )}
    >
      {/* header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[#5E6E66]/20">
        <div className="flex items-center gap-2 min-w-0">
          <Bell size={16} strokeWidth={1.5} className="text-[#3DFF8C] shrink-0" />
          <span className="font-display text-xs tracking-[0.18em] text-[#E6F2EC] uppercase truncate">
            Alert Feed
          </span>
          <span className="rec-blink text-[#FF5C3D] text-[10px] tracking-widest hidden sm:inline">
            ● LIVE
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={refresh}
          className="h-7 px-2 text-[#5E6E66] hover:text-[#3DFF8C] hover:bg-[#3DFF8C]/5 transition-all duration-200"
        >
          <RefreshCw
            size={13}
            strokeWidth={1.5}
            className={cn(loading && 'animate-spin')}
          />
        </Button>
      </div>

      {/* severity tallies */}
      <div className="grid grid-cols-3 divide-x divide-[#5E6E66]/20 border-b border-[#5E6E66]/20">
        {(['critical', 'high', 'medium'] as Severity[]).map((sev) => {
          const style = severityStyle(sev);
          return (
            <div key={sev} className="px-2 py-2 text-center">
              <div
                className="tabular font-display text-base sm:text-lg leading-none"
                style={{ color: style.color }}
              >
                {counts[sev] ?? 0}
              </div>
              <div className="mt-1 text-[9px] tracking-[0.15em] uppercase text-[#5E6E66]">
                {sev}
              </div>
            </div>
          );
        })}
      </div>

      {/* threshold control */}
      <div className="px-3 py-2 border-b border-[#5E6E66]/20">
        <div className="mb-1.5 text-[9px] tracking-[0.18em] uppercase text-[#5E6E66]">
          Z-Threshold
        </div>
        <div className="flex gap-1">
          {thresholds.map((z) => {
            const active = Math.abs(filters.zThreshold - z) < 0.01;
            return (
              <button
                key={z}
                onClick={() => setZThreshold(z)}
                className={cn(
                  'flex-1 px-2 py-1.5 font-display text-[11px] tabular border transition-all duration-200',
                  active
                    ? 'border-[#3DFF8C]/60 bg-[#3DFF8C]/10 text-[#3DFF8C]'
                    : 'border-[#5E6E66]/30 text-[#5E6E66] hover:border-[#3DFF8C]/40 hover:text-[#E6F2EC]'
                )}
              >
                ≥{z.toFixed(1)}
              </button>
            );
          })}
        </div>
      </div>

      {showExamples && (
        <div className="px-3 py-1.5 border-b border-[#5E6E66]/20 bg-[#3DFF8C]/[0.04]">
          <span className="text-[9px] tracking-[0.15em] uppercase text-[#5E6E66]">
            Example alerts · awaiting live pipeline
          </span>
        </div>
      )}

      {error && (
        <div className="px-3 py-2 border-b border-[#FF5C3D]/30 bg-[#FF5C3D]/[0.06]">
          <span className="text-[10px] tracking-wide text-[#FF5C3D]">
            feed error — showing last known
          </span>
        </div>
      )}

      {/* list */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex flex-col">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="px-3 py-3 border-b border-[#5E6E66]/10 animate-pulse"
              >
                <div className="h-3 w-1/2 bg-[#5E6E66]/20" />
                <div className="mt-2 h-2 w-3/4 bg-[#5E6E66]/10" />
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
            <Bell size={22} strokeWidth={1.5} className="text-[#5E6E66] mb-3" />
            <p className="text-xs text-[#E6F2EC]">No alerts fired yet</p>
            <p className="mt-1 text-[10px] text-[#5E6E66] leading-relaxed">
              Alerts trigger when a token's inflow z-score crosses the threshold.
              Baseline net inflow: $1.2M/hr.
            </p>
          </div>
        ) : (
          <TooltipProvider delayDuration={200}>
            <div className="flex flex-col">
              <AnimatePresence initial={false}>
                {list.map((a: Alert, idx) => {
                  const sev =
                    (a.severity as Severity) ||
                    classifySeverity(a.z_score) ||
                    'medium';
                  const style = severityStyle(sev);
                  const Icon = sevIcon(sev);
                  return (
                    <motion.button
                      key={a.id}
                      type="button"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, delay: Math.min(idx * 0.02, 0.2) }}
                      onClick={() => onSelectToken?.(a.token_address)}
                      className={cn(
                        'group w-full text-left px-3 py-2.5 border-b border-[#5E6E66]/10',
                        'transition-all duration-200 hover:bg-[#3DFF8C]/[0.05] focus:outline-none focus:bg-[#3DFF8C]/[0.07]',
                        a.isExample && 'opacity-70'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          size={14}
                          strokeWidth={1.5}
                          style={{ color: style.color }}
                          className="shrink-0"
                        />
                        <span className="font-display text-xs text-[#E6F2EC] tracking-wide truncate">
                          {a.symbol || truncAddress(a.token_address)}
                        </span>
                        <ZScoreChip z={a.z_score} className="ml-auto" />
                      </div>

                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="tabular text-[11px] text-[#3DFF8C]">
                              {usdSigned(a.net_inflow_usd)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent
                            side="left"
                            className="no-radius bg-[#0A0C0B] border border-[#5E6E66]/40 font-display text-[10px]"
                          >
                            net inflow over {a.window_minutes ?? 15}m window
                          </TooltipContent>
                        </Tooltip>
                        <span className="tabular text-[10px] text-[#5E6E66]">
                          {relTime(a.created_at)} ago
                        </span>
                      </div>

                      {a.message && (
                        <p className="mt-1 text-[10px] leading-snug text-[#5E6E66] line-clamp-2">
                          {a.message}
                        </p>
                      )}

                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-[#5E6E66] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <span className="truncate">
                          {truncAddress(a.token_address, false)}
                        </span>
                        <ArrowRight size={11} strokeWidth={1.5} />
                        <span className="text-[#3DFF8C]">inspect</span>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </TooltipProvider>
        )}
      </ScrollArea>

      <Separator className="bg-[#5E6E66]/20" />
      <div className="px-3 py-1.5 flex items-center justify-between">
        <span className="text-[9px] tracking-[0.15em] uppercase text-[#5E6E66]">
          {list.length} alert{list.length === 1 ? '' : 's'}
        </span>
        <span className="text-[9px] tracking-[0.15em] uppercase text-[#5E6E66]">
          not financial advice
        </span>
      </div>
    </div>
  );
}

export default AlertsPanel;
