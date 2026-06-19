import { useAtom } from 'jotai';
import type { ReactNode } from 'react';
import { sessionCostAtom } from './atoms';
import { ZERO_COST } from './cost';

/**
 * Thin status bar showing estimated Firestore operations accrued this session.
 * Counts are approximations derived from result sizes, not exact billing data.
 *
 * @returns The rendered cost bar.
 */
export function CostBar(): ReactNode {
  const [cost, setCost] = useAtom(sessionCostAtom);
  return (
    <div
      className="flex shrink-0 items-center gap-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-1 text-xs text-slate-500 dark:text-slate-400"
      title="Estimated from result sizes — not exact Firestore billing."
    >
      <span className="font-semibold">Session (est.)</span>
      <span>~{cost.reads.toLocaleString()} reads</span>
      <span>{cost.writes.toLocaleString()} writes</span>
      <span>{cost.deletes.toLocaleString()} deletes</span>
      <button
        type="button"
        className="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        onClick={() => setCost(ZERO_COST)}
      >
        Reset
      </button>
    </div>
  );
}
