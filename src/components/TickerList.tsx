import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { List, ShieldCheck, RefreshCw } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MagnitudeBar } from './MagnitudeBar';
import { useTrackedTokens } from '../hooks/useTrackedTokens';
import { useFilters } from '../hooks/useFilters';
import { truncAddress } from '../lib/format';
import { seededRandom, cn } from '../lib/utils';
import type { TrackedToken } from '../types';

interface TickerListProps {
  onSelectToken?: (address: string) => void;
  className?: string;
}

/** Derive a stable mini-magnitude from address so bars don't fabricate live values. */
function miniMagnitude(t: TrackedToken): number {
  return 0.25 + seededRandom(t.token_address) * 0.7;
}

export function TickerList({ onSelectToken, className }: TickerListProps) {
  const { tokens, loading, usingExamples, refresh } = useTrackedTokens({});
  const { filters, setTokenAddress } = useFilters();

  const handleClick = (address: string) => {
    if (filters.tokenAddress === address) {
      setTokenAddress(null);
    } else {
      setTokenAddress(address);
      onSelectToken?.(address);
    }
  };

  const list = useMemo(() => tokens.slice(0, 40), [tokens]);

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-display text-[9px] tracking-[0.2em] text-[#5E6E66]">
          <List size={12} />
          TRACKED TOKENS
          {usingExamples && (
            <Badge className="no-radius border-[#5E6E66]/40 bg-transparent px-1 py-0 font-display text-[8px] tracking-[0.12em] text-[#5E6E66]">
              EXAMPLE
            </Badge>
          )}
        </span>
        <button
          type="button"
          onClick={refresh}
          className="text-[#5E6E66] transition-colors duration-200 hover:text-[#3DFF8C]"
          aria-label="refresh tokens"
        >
          <RefreshCw size={11} className={cn(loading && 'animate-spin')} />
        </button>
      </div>

      <div className="mt-2 flex flex-col">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 py-2">
              <Skeleton className="h-3 w-16 bg-[#5E6E66]/10" />
              <Skeleton className="h-1.5 flex-1 bg-[#5E6E66]/10" />
            </div>
          ))
        ) : list.length === 0 ? (
          <span className="py-4 text-center text-[10px] text-[#5E6E66]">
            No tracked tokens yet.
          </span>
        ) : (
          <TooltipProvider delayDuration={150}>
            {list.map((t, i) => {
              const active = filters.tokenAddress === t.token_address;
              const mag = miniMagnitude(t);
              return (
                <Tooltip key={t.id}>
                  <TooltipTrigger asChild>
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.025, 0.4), duration: 0.25 }}
                      onClick={() => handleClick(t.token_address)}
                      className={cn(
                        'group flex items-center gap-2 border-b border-[#5E6E66]/10 py-2 text-left transition-colors duration-200',
                        active
                          ? 'bg-[#3DFF8C]/[0.07]'
                          : 'hover:bg-[#3DFF8C]/[0.04]'
                      )}
                    >
                      <span
                        className={cn(
                          'flex w-[68px] shrink-0 items-center gap-1 truncate font-display text-[11px] transition-colors duration-200',
                          active ? 'text-[#3DFF8C]' : 'text-[#E6F2EC]'
                        )}
                      >
                        {t.symbol || truncAddress(t.token_address)}
                        {t.verified && (
                          <ShieldCheck size={9} className="shrink-0 text-[#3DFF8C]" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <MagnitudeBar
                          value={mag}
                          max={1}
                          color={active ? '#3DFF8C' : '#5E6E66'}
                          height={3}
                        />
                      </div>
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="no-radius border-[#5E6E66]/40 bg-[#0A0C0B] font-display text-[10px] text-[#E6F2EC]"
                  >
                    <span className="tabular block text-[#5E6E66]">
                      {truncAddress(t.token_address, false)}
                    </span>
                    {t.name && <span className="block">{t.name}</span>}
                    <span className="block text-[#3DFF8C]">
                      {t.verified ? 'VERIFIED' : 'UNVERIFIED'}
                      {t.contract_type ? ` · ${t.contract_type.toUpperCase()}` : ''}
                    </span>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}

export default TickerList;
