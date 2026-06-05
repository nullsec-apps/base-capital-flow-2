import { motion } from 'framer-motion';
import {
  SlidersHorizontal,
  RotateCcw,
  ArrowUpDown,
  Gauge,
  ShieldCheck,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TickerList } from './TickerList';
import { useFilters } from '../hooks/useFilters';
import { usdCompact } from '../lib/format';
import { cn } from '../lib/utils';
import type { TimePeriod, ContractType, SortKey } from '../types';

interface FilterRailProps {
  onSelectToken?: (address: string) => void;
  showTickerList?: boolean;
  className?: string;
}

const PERIODS: TimePeriod[] = ['15m', '1h', '24h', '7d'];
const CONTRACT_TYPES: { value: ContractType; label: string }[] = [
  { value: 'all', label: 'ALL TYPES' },
  { value: 'token', label: 'TOKEN' },
  { value: 'lp', label: 'LP PAIR' },
  { value: 'router', label: 'ROUTER' },
  { value: 'other', label: 'OTHER' },
];
const SORT_KEYS: { value: SortKey; label: string }[] = [
  { value: 'zscore', label: 'Z-SCORE' },
  { value: 'inflow', label: 'NET INFLOW' },
  { value: 'recency', label: 'RECENCY' },
  { value: 'buyers', label: 'BUYERS' },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-display text-[9px] tracking-[0.2em] text-[#5E6E66]">
      {children}
    </span>
  );
}

export function FilterRail({
  onSelectToken,
  showTickerList = true,
  className,
}: FilterRailProps) {
  const {
    filters,
    setAmountRange,
    setPeriod,
    setContractType,
    setZThreshold,
    setVerifiedOnly,
    setSortKey,
    reset,
  } = useFilters();

  return (
    <motion.aside
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn(
        'flex h-full flex-col border-r border-[#5E6E66]/20 bg-[#121615]',
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-[#5E6E66]/15 px-4 py-3">
        <span className="flex items-center gap-2 font-display text-[11px] tracking-[0.16em] text-[#E6F2EC]">
          <SlidersHorizontal size={14} strokeWidth={1.5} className="text-[#3DFF8C]" />
          FILTERS
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={reset}
          className="h-7 gap-1.5 px-2 font-display text-[9px] tracking-[0.14em] text-[#5E6E66] transition-all duration-200 hover:bg-[#3DFF8C]/5 hover:text-[#3DFF8C]"
        >
          <RotateCcw size={11} />
          RESET
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-5 px-4 py-4">
          {/* Period */}
          <div className="flex flex-col gap-2">
            <SectionLabel>TIME PERIOD</SectionLabel>
            <div className="grid grid-cols-4 border border-[#5E6E66]/25">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={cn(
                    'border-r border-[#5E6E66]/15 py-1.5 font-display text-[10px] tracking-[0.1em] transition-all duration-200 last:border-r-0',
                    p === filters.period
                      ? 'bg-[#3DFF8C] text-[#0A0C0B]'
                      : 'text-[#5E6E66] hover:bg-[#3DFF8C]/10 hover:text-[#3DFF8C]'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <Separator className="bg-[#5E6E66]/15" />

          {/* Amount range */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <SectionLabel>NET INFLOW RANGE</SectionLabel>
              <span className="tabular font-display text-[10px] text-[#3DFF8C]">
                {usdCompact(filters.amountMin)} – {usdCompact(filters.amountMax)}
              </span>
            </div>
            <Slider
              min={0}
              max={1_000_000}
              step={5000}
              value={[filters.amountMin, filters.amountMax]}
              onValueChange={(v) => setAmountRange(v[0], v[1])}
              className="py-1"
            />
          </div>

          <Separator className="bg-[#5E6E66]/15" />

          {/* Z threshold */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Gauge size={12} className="text-[#5E6E66]" />
                <SectionLabel>Z-SCORE THRESHOLD</SectionLabel>
              </span>
              <span className="tabular font-display text-[10px] text-[#3DFF8C]">
                z={filters.zThreshold.toFixed(1)}
              </span>
            </div>
            <Slider
              min={0}
              max={8}
              step={0.5}
              value={[filters.zThreshold]}
              onValueChange={(v) => setZThreshold(v[0])}
              className="py-1"
            />
            <div className="flex justify-between tabular text-[9px] text-[#5E6E66]">
              <span>0</span>
              <span className="text-[#3DFF8C]">3.0 FLAG</span>
              <span className="text-[#FFC73D]">4.0</span>
              <span className="text-[#FF5C3D]">6.0+</span>
            </div>
          </div>

          <Separator className="bg-[#5E6E66]/15" />

          {/* Contract type */}
          <div className="flex flex-col gap-2">
            <SectionLabel>CONTRACT TYPE</SectionLabel>
            <Select
              value={filters.contractType}
              onValueChange={(v) => setContractType(v as ContractType)}
            >
              <SelectTrigger className="no-radius h-9 border-[#5E6E66]/25 bg-[#0A0C0B] font-display text-[10px] tracking-[0.1em] text-[#E6F2EC] transition-colors duration-200 hover:border-[#3DFF8C]/40 focus:ring-[#3DFF8C]/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="no-radius border-[#5E6E66]/30 bg-[#121615] font-display text-[10px] tracking-[0.1em] text-[#E6F2EC]">
                {CONTRACT_TYPES.map((t) => (
                  <SelectItem
                    key={t.value}
                    value={t.value}
                    className="text-[10px] focus:bg-[#3DFF8C]/10 focus:text-[#3DFF8C]"
                  >
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-1.5">
              <ArrowUpDown size={12} className="text-[#5E6E66]" />
              <SectionLabel>SORT BY</SectionLabel>
            </span>
            <Select
              value={filters.sortKey}
              onValueChange={(v) => setSortKey(v as SortKey)}
            >
              <SelectTrigger className="no-radius h-9 border-[#5E6E66]/25 bg-[#0A0C0B] font-display text-[10px] tracking-[0.1em] text-[#E6F2EC] transition-colors duration-200 hover:border-[#3DFF8C]/40 focus:ring-[#3DFF8C]/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="no-radius border-[#5E6E66]/30 bg-[#121615] font-display text-[10px] tracking-[0.1em] text-[#E6F2EC]">
                {SORT_KEYS.map((s) => (
                  <SelectItem
                    key={s.value}
                    value={s.value}
                    className="text-[10px] focus:bg-[#3DFF8C]/10 focus:text-[#3DFF8C]"
                  >
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Verified only */}
          <div className="flex items-center justify-between border border-[#5E6E66]/20 px-3 py-2.5">
            <Label
              htmlFor="verified-only"
              className="flex cursor-pointer items-center gap-2 font-display text-[10px] tracking-[0.12em] text-[#E6F2EC]"
            >
              <ShieldCheck size={13} className="text-[#3DFF8C]" />
              VERIFIED ONLY
            </Label>
            <Switch
              id="verified-only"
              checked={filters.verifiedOnly}
              onCheckedChange={setVerifiedOnly}
              className="data-[state=checked]:bg-[#3DFF8C]"
            />
          </div>

          {showTickerList && (
            <>
              <Separator className="bg-[#5E6E66]/15" />
              <TickerList onSelectToken={onSelectToken} />
            </>
          )}
        </div>
      </ScrollArea>
    </motion.aside>
  );
}

export default FilterRail;
