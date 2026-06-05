import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { FilterState, TimePeriod, ContractType, SortKey } from '../types';

const DEFAULT_FILTERS: FilterState = {
  amountMin: 0,
  amountMax: 1_000_000,
  period: '15m',
  contractType: 'all',
  zThreshold: 3.0,
  verifiedOnly: false,
  sortKey: 'zscore',
  tokenAddress: null,
};

interface FiltersContextValue {
  filters: FilterState;
  setAmountRange: (min: number, max: number) => void;
  setPeriod: (p: TimePeriod) => void;
  setContractType: (t: ContractType) => void;
  setZThreshold: (z: number) => void;
  setVerifiedOnly: (v: boolean) => void;
  setSortKey: (k: SortKey) => void;
  setTokenAddress: (a: string | null) => void;
  reset: () => void;
}

const FiltersContext = createContext<FiltersContextValue | null>(null);

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const setAmountRange = useCallback((min: number, max: number) => {
    setFilters((f) => ({ ...f, amountMin: min, amountMax: max }));
  }, []);
  const setPeriod = useCallback((period: TimePeriod) => {
    setFilters((f) => ({ ...f, period }));
  }, []);
  const setContractType = useCallback((contractType: ContractType) => {
    setFilters((f) => ({ ...f, contractType }));
  }, []);
  const setZThreshold = useCallback((zThreshold: number) => {
    setFilters((f) => ({ ...f, zThreshold }));
  }, []);
  const setVerifiedOnly = useCallback((verifiedOnly: boolean) => {
    setFilters((f) => ({ ...f, verifiedOnly }));
  }, []);
  const setSortKey = useCallback((sortKey: SortKey) => {
    setFilters((f) => ({ ...f, sortKey }));
  }, []);
  const setTokenAddress = useCallback((tokenAddress: string | null) => {
    setFilters((f) => ({ ...f, tokenAddress }));
  }, []);
  const reset = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const value = useMemo(
    () => ({
      filters,
      setAmountRange,
      setPeriod,
      setContractType,
      setZThreshold,
      setVerifiedOnly,
      setSortKey,
      setTokenAddress,
      reset,
    }),
    [
      filters,
      setAmountRange,
      setPeriod,
      setContractType,
      setZThreshold,
      setVerifiedOnly,
      setSortKey,
      setTokenAddress,
      reset,
    ]
  );

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useFilters(): FiltersContextValue {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error('useFilters must be used within FiltersProvider');
  return ctx;
}

/** Period -> milliseconds lookback. */
export function periodToMs(period: TimePeriod): number {
  switch (period) {
    case '15m':
      return 15 * 60 * 1000;
    case '1h':
      return 60 * 60 * 1000;
    case '24h':
      return 24 * 60 * 60 * 1000;
    case '7d':
      return 7 * 24 * 60 * 60 * 1000;
    default:
      return 15 * 60 * 1000;
  }
}

/** ISO cutoff timestamp for a given period. */
export function periodCutoff(period: TimePeriod): string {
  return new Date(Date.now() - periodToMs(period)).toISOString();
}
