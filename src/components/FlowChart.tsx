import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip as RTooltip,
  ReferenceDot,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { useFlowCharts } from '../hooks/useFlowCharts';
import { usdCompact, clockTime, fmtZ } from '../lib/format';
import { zStyle } from '../lib/zscore';
import { cn } from '../lib/utils';
import type { TimePeriod } from '../types';

const PERIODS: TimePeriod[] = ['15m', '1h', '24h', '7d'];

interface FlowChartProps {
  tokenAddress: string;
  period: TimePeriod;
  onPeriodChange?: (p: TimePeriod) => void;
  symbol?: string | null;
  className?: string;
}

function ChartTip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const s = zStyle(p.z);
  return (
    <div className="border border-[#5E6E66]/40 bg-[#0A0C0B] px-2.5 py-2 shadow-[0_0_20px_rgba(0,0,0,0.6)]">
      <div className="tabular font-display text-[10px] text-[#5E6E66]">
        {clockTime(p.iso)}
      </div>
      <div className="tabular font-display text-sm text-[#3DFF8C]">
        {usdCompact(p.netInflow)}
      </div>
      {p.z !== null && (
        <div className="tabular text-[10px]" style={{ color: s.color }}>
          z={fmtZ(p.z)} {p.anomaly ? '· ANOMALY' : ''}
        </div>
      )}
    </div>
  );
}

/** Per-token historical flow chart: inflow area + baseline band + anomaly markers. */
export function FlowChart({
  tokenAddress,
  period,
  onPeriodChange,
  symbol,
  className,
}: FlowChartProps) {
  const { series, loading, error, connection } = useFlowCharts(period, tokenAddress);

  const anomalyDots = useMemo(
    () => series.points.filter((p) => p.anomaly),
    [series.points]
  );

  const hasData = series.points.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn('flex flex-col border border-[#5E6E66]/20 bg-[#121615]', className)}
    >
      <div className="flex items-center justify-between gap-2 border-b border-[#5E6E66]/15 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <TrendingUp size={14} className="shrink-0 text-[#3DFF8C]" strokeWidth={1.5} />
          <span className="truncate font-display text-[11px] tracking-[0.14em] text-[#E6F2EC]">
            NET INFLOW{symbol ? ` · ${symbol}` : ''}
          </span>
          {hasData && series.anomalyCount > 0 && (
            <span className="tabular text-[10px] text-[#FF5C3D]">
              {series.anomalyCount} flagged
            </span>
          )}
        </div>
        <div className="flex shrink-0 gap-0 border border-[#5E6E66]/25">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPeriodChange?.(p)}
              className={cn(
                'px-2 py-1 font-display text-[10px] tracking-[0.1em] transition-all duration-200',
                p === period
                  ? 'bg-[#3DFF8C] text-[#0A0C0B]'
                  : 'text-[#5E6E66] hover:bg-[#3DFF8C]/10 hover:text-[#3DFF8C]'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[200px] w-full p-2 sm:h-[240px]">
        {loading ? (
          <div className="flex h-full flex-col justify-end gap-2 px-2 pb-4">
            {[40, 65, 50, 80, 55].map((h, i) => (
              <Skeleton
                key={i}
                className="w-full bg-[#5E6E66]/10"
                style={{ height: `${h / 5}px` }}
              />
            ))}
            <Skeleton className="mt-2 h-3 w-full bg-[#5E6E66]/10" />
          </div>
        ) : error || connection === 'error' ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-[#FF5C3D]">
            <AlertTriangle size={20} strokeWidth={1.5} />
            <span className="font-display text-[11px] tracking-[0.12em]">CHART UNAVAILABLE</span>
            <span className="text-[10px] text-[#5E6E66]">Stream interrupted — retrying</span>
          </div>
        ) : !hasData ? (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 text-[#5E6E66]">
            <TrendingUp size={20} strokeWidth={1.5} />
            <span className="font-display text-[11px] tracking-[0.12em]">NO SNAPSHOTS YET</span>
            <span className="text-center text-[10px] leading-relaxed">
              Flow history for this contract will plot here<br />once the pipeline writes data.
            </span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series.points} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="inflowFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3DFF8C" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#3DFF8C" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#5E6E66" strokeOpacity={0.1} vertical={false} />
              <XAxis
                dataKey="t"
                tickFormatter={(t) => clockTime(new Date(t).toISOString())}
                tick={{ fill: '#5E6E66', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
                axisLine={{ stroke: '#5E6E66', strokeOpacity: 0.2 }}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                tickFormatter={(v) => usdCompact(v)}
                tick={{ fill: '#5E6E66', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <RTooltip content={<ChartTip />} cursor={{ stroke: '#3DFF8C', strokeOpacity: 0.2 }} />
              <ReferenceLine
                y={series.mean}
                stroke="#5E6E66"
                strokeDasharray="3 3"
                strokeOpacity={0.6}
                label={{
                  value: 'baseline',
                  position: 'insideTopLeft',
                  fill: '#5E6E66',
                  fontSize: 9,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              />
              <ReferenceLine
                y={series.upperBand}
                stroke="#FFC73D"
                strokeDasharray="2 4"
                strokeOpacity={0.5}
              />
              <Area
                type="monotone"
                dataKey="netInflow"
                stroke="#3DFF8C"
                strokeWidth={1.5}
                fill="url(#inflowFill)"
                isAnimationActive
                animationDuration={500}
              />
              {anomalyDots.map((p) => (
                <ReferenceDot
                  key={p.t}
                  x={p.t}
                  y={p.netInflow}
                  r={3}
                  fill={zStyle(p.z).color}
                  stroke="#0A0C0B"
                  strokeWidth={1}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}

export default FlowChart;
