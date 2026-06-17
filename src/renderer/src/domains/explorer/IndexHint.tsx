import type { QuerySpec } from '@shared/types/firestore'
import { type ReactNode, useState } from 'react'
import { Button } from '../../components/ui'
import { api } from '../../lib/api'
import { extractIndexUrl, indexesFileSnippet } from './indexes'

/** Props for {@link IndexHint}. */
interface IndexHintProps {
  /** The spec that triggered the missing-index error. */
  spec: QuerySpec
  /** The raw error message (may contain a console URL). */
  message: string
}

/**
 * Panel shown when a query fails for lack of a composite index. Offers the
 * Firebase console link (when present) and a generated `firestore.indexes.json`
 * snippet to copy or save.
 *
 * @param props - The originating spec and the error message.
 * @returns The rendered hint panel.
 */
export function IndexHint({ spec, message }: IndexHintProps): ReactNode {
  const [open, setOpen] = useState(false)
  const url = extractIndexUrl(message)
  const snippet = indexesFileSnippet(spec)

  return (
    <div className="space-y-2 rounded bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
      <p className="font-semibold">This query needs a composite index.</p>
      <div className="flex flex-wrap gap-2">
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="rounded bg-amber-600 px-2 py-1 font-medium text-white hover:bg-amber-500"
          >
            Create index in console
          </a>
        )}
        <Button variant="ghost" onClick={() => setOpen((value) => !value)}>
          {open ? 'Hide' : 'Show'} firestore.indexes.json
        </Button>
      </div>
      {open && (
        <>
          <pre className="overflow-auto rounded bg-white dark:bg-slate-950 p-2 font-mono text-slate-700 dark:text-slate-300">
            {snippet}
          </pre>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => void navigator.clipboard.writeText(snippet)}>
              Copy
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                void api.saveFile('firestore.indexes.json', snippet, [
                  { name: 'JSON', extensions: ['json'] },
                ])
              }
            >
              Save…
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
