import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Activity,
  Droplets,
  Users,
  ArrowUpRight,
  AlertTriangle,
  Crosshair,
  Hash,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ZScoreChip } from './ZScoreChip';
import { FlowChart } from './FlowChart';
import { useTrackedTokens } from '../hooks/useTrackedTokens';
import { useAlerts } from '../hooks/useAlerts';
import {
  usdCompact,
  usdSigned,
  usdPrice,
  countCompact,
  truncAddress,
  relTime,
  fmtPct,
} from '../lib/format';
import {
  basescanToken,
  basescanAddress,
  resolveDexUrl,
} from '../lib/baseLinks';
import { severityStyle, classifySeverity } from '../lib/zscore';
import { copyText, cn } from '../lib/utils';
import type { FlowSnapshot, TimePeriod, Severity } from '../types';

interface AnomalyInspectorProps {
  snapshot: FlowSnapshot | null;
  period: TimePeriod;
  onPeriodChange?: (p: TimePeriod) => void;
  onClose?: () => void;
  className?: string;
}

function StatRow({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[#5E6E66]/10 py-2">
      <span className="flex items-center gap-2 text-[10px] tracking-[0.12em] text-[#5E6E66]">
        <Icon size={13} strokeWidth={1.5} />
        {label}
      </span>
      <span
        className="tabular font-display text-xs"
        style={{ color: accent || '#E6F2EC' }}
      >
        {value}
      </span>
    </div>
  );
}

export function AnomalyInspector({
  snapshot,
  period,
  onPeriodChange,
  onClose,
  className,
}: AnomalyInspectorProps) {
  const [copied, setCopied] = useState(false);
  const address = snapshot?.token_address ?? null;
  const { getToken } = useTrackedTokens({ tokenAddress: address });
  const { alerts } = useAlerts({ tokenAddress: address });

  const tracked = address ? getToken(address) : undefined;
  const symbol = snapshot?.symbol || tracked?.symbol || null;
  const name = snapshot?.name || tracked?.name || null;
  const verified = snapshot?.verified ?? tracked?.verified ?? false;
  const dexUrl = resolveDexUrl(address ?? '', snapshot?.dex_url || tracked?.dex_url);

  const sev = useMemo(
    () => classifySeverity(snapshot?.z_score),
    [snapshot?.z_score]
  );
  const sevStyle = severityStyle(sev);

  const handleCopy = async () => {
    if (!address) return;
    const ok = await copyText(address);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    }
  };

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-l border-[#5E6E66]/20 bg-[#121615]',
        className
      )}
    >
      <AnimatePresence mode="wait">
        {!snapshot ? (
          <motion.div
            key="inspector-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center"
          >
            <Crosshair size={26} strokeWidth={1.5} className="text-[#5E6E66]" />
            <span className="font-display text-[11px] tracking-[0.16em] text-[#5E6E66]">
              INSPECTOR IDLE
            </span>
            <p className="max-w-[220px] text-[10px] leading-relaxed text-[#5E6E66]">
              Select a row in the flow feed — or use{' '}
              <span className="text-[#3DFF8C]">↑↓</span> + Enter — to inspect a
              contract’s inflow, liquidity, and alert history.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={snapshot.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex h-full flex-col"
          >
            <div className="flex items-start justify-between gap-2 border-b border-[#5E6E66]/15 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-display text-base font-bold tracking-tight text-[#E6F2EC]">
                    {symbol || truncAddress(snapshot.token_address)}
                  </span>
                  {verified ? (
                    <Badge className="no-radius gap-1 border-[#3DFF8C]/40 bg-[#3DFF8C]/5 px-1.5 py-0 font-display text-[9px] tracking-[0.12em] text-[#3DFF8C]">
                      <ShieldCheck size={10} />
                      VERIFIED
                    </Badge>
                  ) : (
                    <Badge className="no-radius border-[#5E6E66]/40 bg-transparent px-1.5 py-0 font-display text-[9px] tracking-[0.12em] text-[#5E6E66]">
                      UNVERIFIED
                    </Badge>
                  )}
                </div>
                {name && (
                  <span className="mt-0.5 block truncate text-[10px] text-[#5E6E66]">
                    {name}
                  </span>
                )}
              </div>
              {onClose && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-7 w-7 shrink-0 text-[#5E6E66] transition-colors duration-200 hover:bg-[#FF5C3D]/10 hover:text-[#FF5C3D]"
                >
                  <X size={15} />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 border-b border-[#5E6E66]/15 px-4 py-2.5">
              <button
                type="button"
                onClick={handleCopy}
                className="group flex min-w-0 flex-1 items-center gap-1.5 text-left transition-colors duration-200"
              >
                <Hash size={12} className="shrink-0 text-[#5E6E66]" />
                <span className="tabular truncate text-[11px] text-[#5E6E66] group-hover:text-[#E6F2EC]">
                  {snapshot.token_address}
                </span>
                {copied ? (
                  <Check size={12} className="shrink-0 text-[#3DFF8C]" />
                ) : (
                  <Copy
                    size={12}
                    className="shrink-0 text-[#5E6E66] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 border-b border-[#5E6E66]/15 px-4 py-2.5">
              <ZScoreChip z={snapshot.z_score} size="md" showLabel />
              <span
                className="tabular font-display text-lg leading-none"
                style={{ color: sevStyle.color }}
              >
                {usdSigned(snapshot.net_inflow_usd)}
              </span>
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <div className="px-4 pb-4">
                <Tabs defaultValue="flow" className="mt-3">
                  <TabsList className="no-radius grid w-full grid-cols-3 gap-0 border border-[#5E6E66]/25 bg-transparent p-0">
                    {['flow', 'chart', 'alerts'].map((t) => (
                      <TabsTrigger
                        key={t}
                        value={t}
                        className="no-radius rounded-none border-r border-[#5E6E66]/15 py-1.5 font-display text-[10px] tracking-[0.12em] text-[#5E6E66] transition-all duration-200 last:border-r-0 data-[state=active]:bg-[#3DFF8C] data-[state=active]:text-[#0A0C0B]"
                      >
                        {t.toUpperCase()}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value="flow" className="mt-3">
                    <StatRow
                      icon={Activity}
                      label="NET INFLOW"
                      value={usdSigned(snapshot.net_inflow_usd)}
                      accent={sevStyle.color}
                    />
                    <StatRow
                      icon={ArrowUpRight}
                      label="INFLOW / OUTFLOW"
                      value={`${usdCompact(snapshot.inflow_usd)} / ${usdCompact(
                        snapshot.outflow_usd
                      )}`}
                    />
                    <StatRow
                      icon={Users}
                      label="UNIQUE BUYERS"
                      value={countCompact(snapshot.unique_buyers)}
                    />
                    <StatRow
                      icon={Hash}
                      label="TX COUNT"
                      value={countCompact(snapshot.tx_count)}
                    />
                    <StatRow
                      icon={Droplets}
                      label="LIQUIDITY"
                      value={usdCompact(snapshot.liquidity_usd)}
                    />
                    <StatRow
                      icon={Activity}
                      label="PRICE"
                      value={usdPrice(snapshot.price_usd)}
                    />
                    <StatRow
                      icon={Activity}
                      label="MARKET CAP / FDV"
                      value={`${usdCompact(
                        snapshot.market_cap
                      )} / ${usdCompact(snapshot.fdv)}`}
                    />
                    <StatRow
                      icon={Activity}
                      label="VOL 24H"
                      value={usdCompact(snapshot.volume_24h)}
                    />
                    <StatRow
                      icon={Activity}
                      label="VOL / MCAP"
                      value={fmtPct(snapshot.volume_to_market_cap)}
                      accent={
                        (snapshot.volume_to_market_cap ?? 0) >= 0.3
                          ? '#3DFF8C'
                          : undefined
                      }
                    />

                    <div className="mt-4 flex flex-col gap-2">
                      <a
                        href={basescanToken(snapshot.token_address)}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center justify-between border border-[#5E6E66]/25 px-3 py-2 transition-all duration-200 hover:border-[#3DFF8C]/50 hover:bg-[#3DFF8C]/[0.04]"
                      >
                        <span className="font-display text-[10px] tracking-[0.12em] text-[#E6F2EC]">
                          VIEW ON BASESCAN
                        </span>
                        <ExternalLink
                          size={13}
                          className="text-[#5E6E66] transition-colors duration-200 group-hover:text-[#3DFF8C]"
                        />
                      </a>
                      <a
                        href={dexUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center justify-between border border-[#5E6E66]/25 px-3 py-2 transition-all duration-200 hover:border-[#3DFF8C]/50 hover:bg-[#3DFF8C]/[0.04]"
                      >
                        <span className="font-display text-[10px] tracking-[0.12em] text-[#E6F2EC]">
                          VIEW ON DEXSCREENER
                        </span>
                        <ExternalLink
                          size={13}
                          className="text-[#5E6E66] transition-colors duration-200 group-hover:text-[#3DFF8C]"
                        />
                      </a>
                      <a
                        href={basescanAddress(snapshot.token_address)}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center justify-between border border-[#5E6E66]/25 px-3 py-2 transition-all duration-200 hover:border-[#3DFF8C]/50 hover:bg-[#3DFF8C]/[0.04]"
                      >
                        <span className="font-display text-[10px] tracking-[0.12em] text-[#E6F2EC]">
                          HOLDER / WALLET CLUSTER
                        </span>
                        <ExternalLink
                          size={13}
                          className="text-[#5E6E66] transition-colors duration-200 group-hover:text-[#3DFF8C]"
                        />
                      </a>
                    </div>
                    <p className="mt-3 text-[9px] leading-relaxed text-[#5E6E66]">
                      Z-score is a statistical signal, not financial advice. High
                      inflow does not guarantee a legitimate project — verify the
                      contract independently.
                    </p>
                  </TabsContent>

                  <TabsContent value="chart" className="mt-3">
                    <FlowChart
                      tokenAddress={snapshot.token_address}
                      period={period}
                      onPeriodChange={onPeriodChange}
                      symbol={symbol}
                    />
                  </TabsContent>

                  <TabsContent value="alerts" className="mt-3">
                    {alerts.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 border border-dashed border-[#5E6E66]/25 py-8 text-center">
                        <AlertTriangle
                          size={18}
                          strokeWidth={1.5}
                          className="text-[#5E6E66]"
                        />
                        <span className="font-display text-[10px] tracking-[0.12em] text-[#5E6E66]">
                          NO ALERTS FOR THIS CONTRACT
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {alerts.map((a, i) => {
                          const aSev =
                            (a.severity as Severity) ||
                            classifySeverity(a.z_score) ||
                            'medium';
                          const aStyle = severityStyle(aSev);
                          return (
                            <motion.div
                              key={a.id}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.04 }}
                              className="flex items-start gap-2.5 border-b border-[#5E6E66]/10 py-2.5"
                            >
                              <ZScoreChip z={a.z_score} compact />
                              <div className="min-w-0 flex-1">
                                <span className="block text-[11px] leading-snug text-[#E6F2EC]">
                                  {a.message ||
                                    `Anomalous inflow ${usdSigned(
                                      a.net_inflow_usd
                                    )}`}
                                </span>
                                <span className="tabular mt-0.5 block text-[9px] text-[#5E6E66]">
                                  {relTime(a.created_at)} ·{' '}
                                  <span style={{ color: aStyle.color }}>
                                    {aStyle.label}
                                  </span>
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}

export default AnomalyInspector;
