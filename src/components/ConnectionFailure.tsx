import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '../lib/utils';
import type { ConnectionState } from '../types';

interface ConnectionFailureProps {
  state: ConnectionState;
  onRetry?: () => void;
  className?: string;
}

/** Terminal-style disconnected banner shown over dimmed last-known data. */
export function ConnectionFailure({ state, onRetry, className }: ConnectionFailureProps) {
  const show = state === 'offline' || state === 'error';
  const isError = state === 'error';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          role="alert"
          className={cn(
            'flex items-center gap-3 border border-[#FF5C3D]/50 bg-[#FF5C3D]/[0.07] px-3 py-2.5 sm:px-4',
            className
          )}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center text-[#FF5C3D]">
            {isError ? (
              <AlertTriangle size={16} strokeWidth={2} />
            ) : (
              <WifiOff size={16} strokeWidth={2} className="animate-pulse" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[11px] tracking-[0.16em] text-[#FF5C3D]">
              {isError ? 'FEED ERROR' : 'FEED DISCONNECTED'}
            </span>
            <span className="block text-[10px] leading-relaxed text-[#5E6E66]">
              {isError
                ? 'Stream interrupted — showing last-known data.'
                : 'Retrying connection to live snapshots…'}
            </span>
          </span>
          {onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="h-7 shrink-0 gap-1.5 px-2 font-display text-[10px] tracking-[0.14em] text-[#FF5C3D] transition-all duration-200 hover:bg-[#FF5C3D]/10 hover:text-[#FF5C3D]"
            >
              <RefreshCw size={12} />
              RETRY
            </Button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ConnectionFailure;
