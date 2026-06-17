import type { SecurityRules } from '@shared/types/rules'
import { type ReactNode, useEffect, useState } from 'react'
import { Button, ErrorBanner } from '../../components/ui'
import { api, unwrap } from '../../lib/api'
import { useAsync } from '../../lib/useAsync'

/** Props for {@link RulesDialog}. */
interface RulesDialogProps {
  /** Connection whose project rules to show, or `null` when none is selected. */
  connectionId: string | null
  /** Dismiss handler. */
  onClose: () => void
}

/**
 * Read-only viewer for a project's active Firestore Security Rules. Fetches the
 * rules on open; no editing or simulation.
 *
 * @param props - Connection id and a close handler.
 * @returns The rendered dialog.
 */
export function RulesDialog({ connectionId, onClose }: RulesDialogProps): ReactNode {
  const { error, busy, run } = useAsync()
  const [rules, setRules] = useState<SecurityRules | null>(null)

  useEffect(() => {
    if (!connectionId) return
    void run(async () => setRules(await unwrap(api.getActiveRules(connectionId))))
  }, [connectionId, run])

  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-[44rem] max-w-[92vw] flex-col gap-3 rounded-lg bg-white dark:bg-slate-800 p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold dark:text-slate-200">Security Rules</h2>
          <Button variant="ghost" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>
        {!connectionId && <p className="text-sm text-slate-400">Select a connection first.</p>}
        <ErrorBanner message={error} />
        {busy && <p className="text-sm text-slate-400">Loading…</p>}
        {rules && (
          <pre className="min-h-0 flex-1 overflow-auto rounded bg-slate-100 dark:bg-slate-950 p-3 font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
            {rules.source || '(empty ruleset)'}
          </pre>
        )}
      </div>
    </div>
  )
}
