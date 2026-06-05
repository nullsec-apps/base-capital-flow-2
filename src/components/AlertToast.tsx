import { useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { useAlerts } from '../hooks/useAlerts';
import { usdSigned, truncAddress, fmtZ } from '../lib/format';
import type { Alert } from '../types';

interface AlertToastProps {
  onSelectToken?: (address: string) => void;
}

/** Terminal-style toast fired on new z>=6 critical alert. */
export function AlertToast({ onSelectToken }: AlertToastProps) {
  const selectRef = useRef(onSelectToken);
  selectRef.current = onSelectToken;

  const fire = (a: Alert) => {
    toast.custom(
      (t) => (
        <button
          type="button"
          onClick={() => {
            selectRef.current?.(a.token_address);
            toast.dismiss(t.id);
          }}
          className={`group flex w-[320px] max-w-[92vw] items-stretch gap-0 border border-[#FF5C3D]/60 bg-[#121615] no-radius text-left shadow-[0_0_24px_rgba(255,92,61,0.25)] transition-all duration-200 hover:border-[#FF5C3D] ${
            t.visible ? 'animate-in fade-in slide-in-from-top-2' : 'opacity-0'
          }`}
        >
          <span className="w-1 shrink-0 bg-[#FF5C3D] animate-pulse" />
          <span className="flex flex-1 flex-col gap-1 p-3">
            <span className="flex items-center gap-2 text-[#FF5C3D]">
              <ShieldAlert size={16} strokeWidth={2} />
              <span className="font-display text-[11px] tracking-[0.18em]">
                CRITICAL ANOMALY
              </span>
              <span className="ml-auto font-display text-base tabular leading-none">
                z={fmtZ(a.z_score)}
              </span>
            </span>
            <span className="flex items-center justify-between gap-2 text-[#E6F2EC]">
              <span className="font-display text-sm">
                {a.symbol || truncAddress(a.token_address)}
              </span>
              <span className="tabular font-display text-sm text-[#3DFF8C]">
                {usdSigned(a.net_inflow_usd)}
              </span>
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[#5E6E66] transition-colors duration-200 group-hover:text-[#3DFF8C]">
              OPEN INSPECTOR <ArrowRight size={11} />
            </span>
          </span>
        </button>
      ),
      { duration: 7000, id: `alert-${a.id}` }
    );
  };

  useAlerts({ onHighSeverity: fire });

  useEffect(() => () => toast.dismiss(), []);

  return (
    <Toaster
      position="top-right"
      containerClassName="!top-20 !right-3"
      gutter={8}
      toastOptions={{ style: { background: 'transparent', boxShadow: 'none', padding: 0 } }}
    />
  );
}

export default AlertToast;
