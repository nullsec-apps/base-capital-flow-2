import { supabase } from './supabase';
import { table } from './utils';

/**
 * Thin typed accessor layer over the platform Supabase client.
 * NEVER calls createClient directly — re-exports the platform singleton.
 */
export { supabase };

export const TABLES = {
  sources: () => table('sources'),
  trackedTokens: () => table('tracked_tokens'),
  flowSnapshots: () => table('flow_snapshots'),
  alerts: () => table('alerts'),
} as const;

/** Query builder shortcut for a logical table. */
export function from(name: keyof typeof TABLES) {
  return supabase.from(TABLES[name]());
}

/** Detect whether Supabase is configured / reachable for graceful fallback. */
export async function pingSupabase(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(TABLES.flowSnapshots())
      .select('id', { count: 'exact', head: true })
      .limit(1);
    // Missing table or RLS still implies the connection works.
    if (!error) return true;
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('does not exist') || msg.includes('permission')) return true;
    return false;
  } catch {
    return false;
  }
}
