import { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import { StatusBar } from './StatusBar';
import { FlowTape } from './FlowTape';
import { cn } from '../lib/utils';

interface TerminalLayoutProps {
  /** brand logo / wordmark slot */
  brand?: ReactNode;
  /** desktop left rail */
  leftRail: ReactNode;
  /** desktop center column */
  center: ReactNode;
  /** desktop right inspector */
  rightRail: ReactNode;
  /** mobile body — caller controls tab switching */
  mobileBody: ReactNode;
  /** mobile bottom tab bar */
  mobileTabBar: ReactNode;
  inflow24h: number;
  anomalyCount: number;
  threshold?: number;
  onSelectToken?: (address: string) => void;
  className?: string;
}

/**
 * Root three-column command-deck shell. Renders the top bar (REC dot, 24h net
 * inflow counter, source health), the signature FLOW TAPE, the trading-desk grid
 * on desktop and a single-column stack + bottom tab bar on mobile.
 */
export function TerminalLayout({
  brand,
  leftRail,
  center,
  rightRail,
  mobileBody,
  mobileTabBar,
  inflow24h,
  anomalyCount,
  threshold = 3.0,
  onSelectToken,
  className,
}: TerminalLayoutProps) {
  const [scanlines] = useState(true);

  return (
    <div
      className={cn(
        'relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[#0A0C0B] text-[#E6F2EC]',
        className
      )}
    >
      {/* subtle terminal scanline texture */}
      {scanlines && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, #3DFF8C 0, #3DFF8C 1px, transparent 1px, transparent 3px)',
          }}
        />
      )}

      {/* ===== TOP BAR ===== */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-20 flex flex-col border-b border-[#5E6E66]/25 bg-[#0A0C0B]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0A0C0B]/85"
      >
        <div className="flex items-center gap-2 px-3 py-2 sm:px-4">
          <div className="flex shrink-0 items-center gap-2">
            {brand ?? (
              <span className="font-display text-sm font-bold tracking-[0.22em] text-[#3DFF8C]">
                BASEFLOW
              </span>
            )}
            <span className="hidden font-display text-[9px] tracking-[0.18em] text-[#5E6E66] sm:inline">
              ANOMALY DECK
            </span>
          </div>
          <Separator orientation="vertical" className="mx-1 hidden h-4 bg-[#5E6E66]/30 sm:block" />
          <div className="min-w-0 flex-1 overflow-hidden">
            <StatusBar inflow24h={inflow24h} anomalyCount={anomalyCount} />
          </div>
        </div>
      </motion.header>

      {/* ===== FLOW TAPE (pinned all viewports) ===== */}
      <FlowTape
        threshold={threshold}
        onSelectToken={onSelectToken}
        className="relative z-10 h-9 shrink-0"
      />

      {/* ===== DESKTOP GRID ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative z-10 hidden min-h-0 flex-1 lg:grid"
        style={{ gridTemplateColumns: '260px minmax(0,1fr) 360px' }}
      >
        <div className="min-h-0 overflow-hidden">{leftRail}</div>
        <div className="min-h-0 overflow-hidden border-x border-[#5E6E66]/20">{center}</div>
        <div className="min-h-0 overflow-hidden">{rightRail}</div>
      </motion.div>

      {/* ===== TABLET GRID (no inspector rail) ===== */}
      <div
        className="relative z-10 hidden min-h-0 flex-1 md:grid lg:hidden"
        style={{ gridTemplateColumns: '240px minmax(0,1fr)' }}
      >
        <div className="min-h-0 overflow-hidden">{leftRail}</div>
        <div className="min-h-0 overflow-hidden border-l border-[#5E6E66]/20">{center}</div>
      </div>

      {/* ===== MOBILE STACK ===== */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden pb-[56px] md:hidden">
        <div className="min-h-0 flex-1 overflow-hidden">{mobileBody}</div>
      </div>

      {/* mobile bottom nav */}
      <div className="md:hidden">{mobileTabBar}</div>
    </div>
  );
}

export default TerminalLayout;
