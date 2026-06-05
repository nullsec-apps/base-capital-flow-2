import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FiltersProvider, useFilters } from './hooks/useFilters';
import { useFlowTape } from './hooks/useFlowTape';
import { useAlerts } from './hooks/useAlerts';
import { TerminalLayout } from './components/TerminalLayout';
import { HeroLanding } from './components/HeroLanding';
import { FilterRail } from './components/FilterRail';
import { FlowFeedTable } from './components/FlowFeedTable';
import { ChartsView } from './components/ChartsView';
import { AlertsPanel } from './components/AlertsPanel';
import { AnomalyInspector } from './components/AnomalyInspector';
import { AlertToast } from './components/AlertToast';
import { MobileTabBar } from './components/MobileTabBar';
import type { FlowSnapshot, MobileTab } from './types';

function Deck() {
  const { filters, setPeriod, setTokenAddress } = useFilters();
  const { inflow24h, anomalyCount } = useFlowTape(filters.zThreshold);
  const { alerts } = useAlerts();

  const [entered, setEntered] = useState(false);
  const [selected, setSelected] = useState<FlowSnapshot | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('feed');
  const [mobileSheet, setMobileSheet] = useState(false);

  const handleSelectSnapshot = useCallback(
    (snap: FlowSnapshot) => {
      setSelected(snap);
      setTokenAddress(snap.token_address);
      setMobileSheet(true);
    },
    [setTokenAddress]
  );

  // tape / alerts give us only an address — wrap into a minimal snapshot
  const handleSelectAddress = useCallback(
    (address: string) => {
      setSelected((prev) =>
        prev && prev.token_address === address
          ? prev
          : ({
              id: `sel-${address}`,
              token_address: address,
              net_inflow_usd: null,
              inflow_usd: null,
              outflow_usd: null,
              unique_buyers: null,
              tx_count: null,
              market_cap: null,
              fdv: null,
              volume_24h: null,
              volume_to_market_cap: null,
              liquidity_usd: null,
              price_usd: null,
              z_score: null,
              window_minutes: null,
              dex_url: null,
              raw: null,
              created_at: new Date().toISOString(),
            } as FlowSnapshot)
      );
      setTokenAddress(address);
      setMobileSheet(true);
    },
    [setTokenAddress]
  );

  const closeInspector = useCallback(() => {
    setSelected(null);
    setTokenAddress(null);
    setMobileSheet(false);
  }, [setTokenAddress]);

  if (!entered) {
    return (
      <div className="min-h-[100dvh] bg-[#0A0C0B]">
        <HeroLanding onOpenFeed={() => setEntered(true)} />
        <AlertToast onSelectToken={handleSelectAddress} />
      </div>
    );
  }

  // ===== mobile body switches on tab =====
  const mobileBody = (
    <div className="flex h-full min-h-0 flex-col">
      <AnimatePresence mode="wait">
        <motion.div
          key={mobileTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
          className="flex h-full min-h-0 flex-col"
        >
          {mobileTab === 'feed' && (
            <FlowFeedTable
              onSelectToken={handleSelectSnapshot}
              selectedId={selected?.id}
            />
          )}
          {mobileTab === 'charts' && (
            <ScrollArea className="h-full">
              <div className="p-3">
                <ChartsView period={filters.period} onPeriodChange={setPeriod} />
              </div>
            </ScrollArea>
          )}
          {mobileTab === 'alerts' && (
            <AlertsPanel onSelectToken={handleSelectAddress} className="border-0" />
          )}
          {mobileTab === 'filters' && (
            <FilterRail
              onSelectToken={handleSelectAddress}
              className="border-r-0"
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  return (
    <>
      <TerminalLayout
        inflow24h={inflow24h}
        anomalyCount={anomalyCount}
        threshold={filters.zThreshold}
        onSelectToken={handleSelectAddress}
        leftRail={<FilterRail onSelectToken={handleSelectAddress} />}
        center={
          <FlowFeedTable
            onSelectToken={handleSelectSnapshot}
            selectedId={selected?.id}
          />
        }
        rightRail={
          <AnomalyInspector
            snapshot={selected}
            period={filters.period}
            onPeriodChange={setPeriod}
            onClose={selected ? closeInspector : undefined}
          />
        }
        mobileBody={mobileBody}
        mobileTabBar={
          <MobileTabBar
            active={mobileTab}
            onChange={(t) => {
              setMobileTab(t);
              if (t !== 'feed') setMobileSheet(false);
            }}
            alertCount={alerts.length}
          />
        }
      />

      {/* ===== Mobile full-screen inspector sheet ===== */}
      <AnimatePresence>
        {mobileSheet && selected && (
          <motion.div
            key="mobile-inspector"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex flex-col bg-[#0A0C0B] md:hidden"
          >
            <motion.div
              initial={{ y: 24 }}
              animate={{ y: 0 }}
              exit={{ y: 24 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="flex h-full min-h-0 flex-col"
            >
              <div className="flex items-center justify-between border-b border-[#5E6E66]/25 bg-[#121615] px-4 py-3">
                <span className="font-display text-[11px] tracking-[0.18em] text-[#3DFF8C]">
                  INSPECTOR
                </span>
                <button
                  type="button"
                  onClick={closeInspector}
                  aria-label="close inspector"
                  className="flex h-9 w-9 items-center justify-center text-[#5E6E66] transition-colors duration-200 hover:bg-[#FF5C3D]/10 hover:text-[#FF5C3D]"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="min-h-0 flex-1">
                <AnomalyInspector
                  snapshot={selected}
                  period={filters.period}
                  onPeriodChange={setPeriod}
                  className="border-l-0"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertToast onSelectToken={handleSelectAddress} />
    </>
  );
}

export default function App() {
  return (
    <FiltersProvider>
      <Deck />
    </FiltersProvider>
  );
}
