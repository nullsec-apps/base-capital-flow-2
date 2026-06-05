import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Cell,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, BarChart3, Zap, AlertTriangle } from 'lucide-react';
import { useFlowCharts } from '../hooks/useFlowCharts';
import { usdCompact, clockTime } from '../lib/format';
import { cn } from '../lib/utils';
import type { TimePeriod } from '../types';

const PERIODS: TimePeriod[] = ['15m', '1h', '24h', '7d'];

interface ChartsViewProps {
  period: TimePeriod;
  onPeriodChange?: (p: TimePeriod) => void;
  className?: string;
}

function Panel({
  title,
  icon,
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="flex flex-col border border-[#5E6E66]/20 bg-[#121615]"
    >
      <div className="flex items-center gap-2 border-b border-[#5E6E66]/15 px-3 py-2.5">
        <span className="text-[#3DFF8C]">{icon}</span>
        <span className="font-display text-[11px] tracking-[0.14em] text-[#E6F2EC]">{title}</span>
      </div>
      <div className="h-[200px] w-full p-2 sm:h-[220px]">{children}</div>
    </motion.div>
  );
}

function AggTip({ active, payload, valueKey, label }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="border border-[#5E6E66]/40 bg-[#0A0C0B] px-2.5 py-2">
      <div className="tabular font-display text-[10px] text-[#5E6E66]">{clockTime(p.iso)}</div>
      <div className="tabular font-display text-sm text-[#3DFF8C]">
        {label}: {valueKey === 'totalInflow' ? usdCompact(p[valueKey]) : p[valueKey]}
      </div>
    </div>
  );
}

/** Aggregate charts surface: net-inflow trend + anomaly frequency histogram. */
export function ChartsView({ period, onPeriodChange, className }: ChartsViewProps) {
  const [localPeriod, setLocalPeriod] = useState<TimePeriod>(period);
  const active = onPeriodChange ? period : localPeriod;
  const setPeriod = (p: TimePeriod) => {
    setLocalPeriod(p);
    onPeriodChange?.(p);
  };

  const { aggregate, loading, error, connection } = useFlowCharts(active);

  const hasData = aggregate.length > 0;
  const totalInflow = useMemo(
    () => aggregate.reduce((s, a) => s + a.totalInflow, 0),
    [aggregate]
  );
  const totalAnomalies = useMemo(
    () => aggregate.reduce((s, a) => s + a.anomalies, 0),
    [aggregate]
  );

  const renderBody = (
    kind: 'area' | 'bar',
    key: 'totalInflow' | 'anomalies',
    label: string
  ) => {
    if (loading) {
      return (
        <div className="flex h-full items-end gap-1.5 px-2 pb-4">
          {[55, 40, 70, 35, 80, 45, 60, 90].map((h, i) => (
            <Skeleton
              key={i}
              className="flex-1 bg-[#5E6E66]/10"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      );
    }
    if (error || connection === 'error') {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-[#FF5C3D]">
          <AlertTriangle size={20} strokeWidth={1.5} />
          <span className="font-display text-[11px] tracking-[0.12em]">DATA UNAVAILABLE</span>
        </div>
      );
    }
    if (!hasData) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-1.5 text-[#5E6E66]">
          {kind === 'area' ? <Activity size={20} /> : <BarChart3 size={20} />}
          <span className="font-display text-[11px] tracking-[0.12em]">NO DATA IN WINDOW</span>
          <span className="text-[10px]">Aggregates plot once snapshots arrive.</span>
        </div>
      );
    }
    return (
      <ResponsiveContainer width="100%" height="100%">
        {kind === 'area' ? (
          <AreaChart data={aggregate} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="aggFill" x1="0" y1="0" x2="0" y2="1">
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
            <RTooltip content={<AggTip valueKey={key} label={label} />} cursor={{ stroke: '#3DFF8C', strokeOpacity: 0.2 }} />
            <Area
              type="monotone"
              dataKey={key}
              stroke="#3DFF8C"
              strokeWidth={1.5}
              fill="url(#aggFill)"
              isAnimationActive
              animationDuration={500}
            />
          </AreaChart>
        ) : (
          <BarChart data={aggregate} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
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
              allowDecimals={false}
              tick={{ fill: '#5E6E66', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <RTooltip content={<AggTip valueKey={key} label={label} />} cursor={{ fill: 'rgba(61,255,140,0.06)' }} />
            <Bar dataKey={key} isAnimationActive animationDuration={500}>
              {aggregate.map((a, i) => (
                <Cell key={i} fill={a.anomalies > 0 ? '#FF5C3D' : '#5E6E66'} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    );
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="font-display text-[11px] tracking-[0.18em] text-[#5E6E66]">
            BASE FLOW ANALYTICS
          </span>
          {hasData && (
            <span className="tabular text-[10px] text-[#5E6E66]">
              <span className="text-[#3DFF8C]">{usdCompact(totalInflow)}</span> · {totalAnomalies} flagged
            </span>
          )}
        </div>
        <div className="flex gap-0 border border-[#5E6E66]/25">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                'px-2.5 py-1 font-display text-[10px] tracking-[0.1em] transition-all duration-200',
                p === active
                  ? 'bg-[#3DFF8C] text-[#0A0C0B]'
                  : 'text-[#5E6E66] hover:bg-[#3DFF8C]/10 hover:text-[#3DFF8C]'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <Panel title="AGGREGATE NET INFLOW" icon={<Activity size={14} strokeWidth={1.5} />}>
        {renderBody('area', 'totalInflow', 'Inflow')}
      </Panel>

      <Panel
        title="ANOMALY FREQUENCY"
        icon={<Zap size={14} strokeWidth={1.5} />}
        delay={0.06}
      >
        {renderBody('bar', 'anomalies', 'Flagged')}
      </Panel>
    </div>
  );
}

export default ChartsView;
