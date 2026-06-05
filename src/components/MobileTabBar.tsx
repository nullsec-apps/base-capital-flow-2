import { motion } from 'framer-motion';
import { List, BarChart3, Bell, SlidersHorizontal } from 'lucide-react';
import { cn } from '../lib/utils';
import type { MobileTab } from '../types';

interface MobileTabBarProps {
  active: MobileTab;
  onChange: (tab: MobileTab) => void;
  alertCount?: number;
  className?: string;
}

const TABS: { key: MobileTab; label: string; icon: typeof List }[] = [
  { key: 'feed', label: 'FEED', icon: List },
  { key: 'charts', label: 'CHARTS', icon: BarChart3 },
  { key: 'alerts', label: 'ALERTS', icon: Bell },
  { key: 'filters', label: 'FILTERS', icon: SlidersHorizontal },
];

/**
 * Bottom tab navigation on mobile: FEED / CHARTS / ALERTS / FILTERS.
 */
export function MobileTabBar({
  active,
  onChange,
  alertCount = 0,
  className,
}: MobileTabBarProps) {
  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[#5E6E66]/30 bg-[#0A0C0B]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0A0C0B]/85',
        className
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.key;
        const showBadge = tab.key === 'alerts' && alertCount > 0;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'relative flex min-h-[56px] flex-col items-center justify-center gap-1 transition-colors duration-200',
              isActive ? 'text-[#3DFF8C]' : 'text-[#5E6E66] hover:text-[#E6F2EC]'
            )}
          >
            {isActive && (
              <motion.span
                layoutId="mobile-tab-indicator"
                className="absolute top-0 h-[2px] w-10 bg-[#3DFF8C]"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
            <div className="relative">
              <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              {showBadge && (
                <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-[14px] items-center justify-center bg-[#FF5C3D] px-1 font-display text-[8px] leading-none text-[#0A0C0B]">
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
            </div>
            <span className="font-display text-[9px] tracking-[0.14em]">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default MobileTabBar;
