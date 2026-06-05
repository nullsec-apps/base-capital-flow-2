import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Radio, ShieldAlert, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MagnitudeBar } from './MagnitudeBar';
import { ZScoreChip } from './ZScoreChip';
import { usdSigned, usdCompact, truncAddress, relTime } from '../lib/format';
import { isAnomaly, Z_CRITICAL, zStyle } from '../lib/zscore';
import { SAMPLE_SNAPSHOTS, SAMPLE_24H_INFLOW, BASELINE } from '../lib/sampleData';
import { cn } from '../lib/utils';

interface HeroLandingProps {
  onOpenFeed: () => void;
  className?: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: 'easeOut' as const },
  }),
};

/**
 * First-load impact screen. Headline + subheadline + CTA + proof FLOW TAPE strip
 * with clearly-labeled example rows and a 24h inflow counter.
 */
export function HeroLanding({ onOpenFeed, className }: HeroLandingProps) {
  const rows = useMemo(() => SAMPLE_SNAPSHOTS.slice(0, 3), []);
  const max = useMemo(
    () => Math.max(1, ...rows.map((r) => Math.abs(r.net_inflow_usd ?? 0))),
    [rows]
  );

  return (
    <div
      className={cn(
        'relative flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center overflow-hidden bg-[#0A0C0B] px-4 py-10 sm:px-6',
        className
      )}
    >
      {/* grain / scanline texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, #3DFF8C 0, #3DFF8C 1px, transparent 1px, transparent 4px)',
        }}
      />
      <div
        className="pointer-events-none absolute -top-1/3 left-1/2 h-[60vh] w-[80vw] -translate-x-1/2 rounded-full opacity-20 blur-[120px]"
        style={{ background: 'radial-gradient(circle, #3DFF8C 0%, transparent 70%)' }}
      />

      <div className="relative z-10 mx-auto w-full max-w-4xl text-center">
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
          <Badge
            variant="outline"
            className="no-radius mb-6 inline-flex items-center gap-2 border-[#3DFF8C]/40 bg-[#3DFF8C]/5 px-3 py-1 font-display text-[10px] tracking-[0.18em] text-[#3DFF8C]"
          >
            <motion.span
              className="inline-block h-1.5 w-1.5 rounded-full bg-[#FF5C3D]"
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            BASE CHAIN · LIVE ANOMALY DECK
          </Badge>
        </motion.div>

        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="font-display text-3xl font-bold leading-[1.05] tracking-tight text-[#E6F2EC] sm:text-5xl lg:text-6xl"
        >
          UNUSUAL CAPITAL IS{' '}
          <span className="text-[#3DFF8C]">MOVING ON BASE</span>
        </motion.h1>

        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mx-auto mt-5 max-w-2xl font-sans text-sm leading-relaxed text-[#5E6E66] sm:text-base"
        >
          We watch every inflow on the BASE chain in real time and flag anomalous positive
          spikes — so you find the contract before the chart does.
        </motion.p>

        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button
            onClick={onOpenFeed}
            className="no-radius group h-11 w-full gap-2 bg-[#3DFF8C] px-6 font-display text-sm tracking-[0.12em] text-[#0A0C0B] transition-all duration-200 hover:bg-[#3DFF8C]/90 hover:shadow-[0_0_24px_rgba(61,255,140,0.35)] sm:w-auto"
          >
            OPEN LIVE FEED
            <ArrowRight
              size={16}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Button>
          <div className="flex items-center gap-2 font-display text-[11px] text-[#5E6E66]">
            <Zap size={13} strokeWidth={1.5} className="text-[#3DFF8C]" />
            <span className="tabular">
              {BASELINE.baselineInflow}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Proof module — example FLOW TAPE strip */}
      <motion.div
        custom={4}
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="relative z-10 mt-12 w-full max-w-3xl"
      >
        <div className="flex items-center justify-between border-b border-[#5E6E66]/25 px-1 pb-2">
          <div className="flex items-center gap-2">
            <Radio size={13} strokeWidth={1.5} className="text-[#3DFF8C]" />
            <span className="font-display text-[10px] tracking-[0.18em] text-[#3DFF8C]">
              FLOW TAPE
            </span>
            <span className="font-display text-[9px] tracking-[0.14em] text-[#5E6E66]">
              EXAMPLE
            </span>
          </div>
          <div className="flex items-center gap-2 font-display text-[11px]">
            <span className="text-[#5E6E66] tracking-[0.1em]">24H NET</span>
            <motion.span
              className="tabular text-[#3DFF8C]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {usdCompact(SAMPLE_24H_INFLOW)}
            </motion.span>
          </div>
        </div>

        <div className="divide-y divide-[#5E6E66]/15 border border-t-0 border-[#5E6E66]/25 bg-[#121615]">
          {rows.map((r, i) => {
            const z = r.z_score ?? 0;
            const anomaly = isAnomaly(z);
            const critical = z >= Z_CRITICAL;
            const style = zStyle(z);
            const accent = critical ? '#FF5C3D' : '#3DFF8C';
            return (
              <motion.button
                key={r.id}
                type="button"
                onClick={onOpenFeed}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.12, duration: 0.4 }}
                className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 text-left transition-colors duration-200 hover:bg-[#3DFF8C]/[0.04] sm:grid-cols-[110px_minmax(0,1fr)_90px_auto]"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="font-display text-xs text-[#E6F2EC] group-hover:text-[#3DFF8C] transition-colors">
                    {r.symbol}
                  </span>
                  <span className="hidden font-display text-[10px] text-[#5E6E66] sm:inline">
                    {truncAddress(r.token_address)}
                  </span>
                </div>

                <div className="hidden items-center gap-2 sm:flex">
                  <div className="flex-1">
                    <MagnitudeBar
                      value={Math.abs(r.net_inflow_usd ?? 0)}
                      max={max}
                      color={accent}
                      height={5}
                    />
                  </div>
                </div>

                <span
                  className="tabular justify-self-end font-display text-xs sm:justify-self-start"
                  style={{ color: '#3DFF8C' }}
                >
                  {usdSigned(r.net_inflow_usd)}
                </span>

                <div className="col-span-2 mt-1 flex items-center gap-2 sm:col-span-1 sm:mt-0 sm:justify-self-end">
                  {anomaly && critical && (
                    <ShieldAlert size={12} strokeWidth={1.6} style={{ color: style.color }} />
                  )}
                  <ZScoreChip z={z} showLabel={anomaly} />
                  <span className="font-display text-[10px] text-[#5E6E66]">
                    {relTime(r.created_at)}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>

        <p className="mt-3 px-1 font-sans text-[11px] leading-relaxed text-[#5E6E66]">
          Rows above are clearly-labeled examples of the live deck. Real anomalies stream in
          once the BASE ingestion pipeline writes verified snapshots — z-scores are
          statistical signals, not financial advice.
        </p>
      </motion.div>
    </div>
  );
}

export default HeroLanding;
