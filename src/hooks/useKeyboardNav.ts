import { useEffect, useCallback, useRef } from 'react';

interface KeyboardNavOptions {
  /** total number of navigable rows */
  count: number;
  /** currently selected index, or -1 for none */
  selectedIndex: number;
  /** update selection index */
  onSelect: (index: number) => void;
  /** Enter pressed on the current row */
  onEnter?: (index: number) => void;
  /** Esc pressed — deselect / close */
  onEscape?: () => void;
  /** disable while typing in inputs etc. */
  enabled?: boolean;
}

/**
 * Terminal-style arrow-key navigation over feed rows.
 * ArrowUp/ArrowDown move selection (clamped), Enter opens, Esc deselects.
 * Ignores key events originating from form controls so filters keep working.
 */
export function useKeyboardNav(opts: KeyboardNavOptions): void {
  const { count, selectedIndex, onSelect, onEnter, onEscape, enabled = true } = opts;
  const ref = useRef({ count, selectedIndex, onSelect, onEnter, onEscape });
  ref.current = { count, selectedIndex, onSelect, onEnter, onEscape };

  const handler = useCallback((e: KeyboardEvent) => {
    const { count, selectedIndex, onSelect, onEnter, onEscape } = ref.current;
    const target = e.target as HTMLElement | null;
    if (target) {
      const tag = target.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }
    }
    if (count <= 0 && e.key !== 'Escape') return;

    switch (e.key) {
      case 'ArrowDown':
      case 'j': {
        e.preventDefault();
        const next = selectedIndex < 0 ? 0 : Math.min(count - 1, selectedIndex + 1);
        onSelect(next);
        break;
      }
      case 'ArrowUp':
      case 'k': {
        e.preventDefault();
        const prev = selectedIndex < 0 ? 0 : Math.max(0, selectedIndex - 1);
        onSelect(prev);
        break;
      }
      case 'Enter': {
        if (selectedIndex >= 0 && selectedIndex < count) {
          e.preventDefault();
          onEnter?.(selectedIndex);
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        onEscape?.();
        break;
      }
      default:
        break;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, handler]);
}
