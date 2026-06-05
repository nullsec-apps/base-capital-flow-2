import { motion } from 'framer-motion';
import { clamp } from '../lib/utils';
import { cn } from '../lib/utils';

interface MagnitudeBarProps {
  value: number | null | undefined;
  max: number;
  color?: string;
  flash?: boolean;
  height?: number;
  className?: string;
}

/**
 * Fixed-width horizontal magnitude bar encoding inflow relative to feed max.
 * Hairline-ruled track, accent fill. Flashes on anomaly first-appearance.
 */
export function MagnitudeBar({
  value,
  max,
  color = '#3DFF8C',
  flash = false,
  height = 4,
  className,
}: MagnitudeBarProps) {
  const v = Math.max(0, value ?? 0);
  const pct = max > 0 ? clamp((v / max) * 100, 0, 100) : 0;

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden bg-[#5E6E66]/15 transition-colors duration-200',
        className
      )}
      style={{ height }}
      role="presentation"
    >
      <motion.div
        className="h-full"
        initial={{ width: 0 }}
        animate={{
          width: `${pct}%`,
          boxShadow: flash
            ? `0 0 10px ${color}, 0 0 4px ${color}`
            : `0 0 0px ${color}00`,
        }}
        transition={{
          width: { duration: 0.45, ease: 'easeOut' },
          boxShadow: { duration: 0.4 },
        }}
        style={{
          backgroundColor: color,
          background: `linear-gradient(90deg, ${color}AA 0%, ${color} 100%)`,
        }}
      />
      {flash && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0.55 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ backgroundColor: color }}
        />
      )}
    </div>
  );
}

export default MagnitudeBar;
