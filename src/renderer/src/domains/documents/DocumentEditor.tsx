import { useAtom } from 'jotai'
import { type ReactNode, useEffect, useState } from 'react'
import { Button, ConfirmDialog, Empty, ErrorBanner } from '../../components/ui'
import { parseJsonObject } from '../../lib/json'
import { useReadOnly } from '../connections/hooks'
import { selectedDocumentAtom } from './atoms'
import { useDocumentMutations } from './hooks'

/** Props for {@link DocumentEditor}. */
interface EditorProps {
  /** Active connection id, or `null`. */
  connectionId: string | null
  /** Invoked after a successful save or delete. */
  onSaved: () => void
}

/**
 * Edit the selected document's fields as formatted JSON, with save/delete.
 *
 * @param props - Connection id and a post-mutation callback.
 * @returns The rendered editor, or an empty-state placeholder.
 */
export function DocumentEditor({ connectionId, onSaved }: EditorProps): ReactNode {
  const [selected, setSelected] = useAtom(selectedDocumentAtom)
  const [draft, setDraft] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const readOnly = useReadOnly()
  const { save, remove, error, busy } = useDocumentMutations(connectionId, onSaved)

  useEffect(() => {
    setDraft(selected ? JSON.stringify(selected.data, null, 2) : '')
    setParseError(null)
  }, [selected])

  if (!selected) return <Empty text="Select or create a document to edit" />
  const doc = selected

  /**
   * Validate the draft JSON and persist the document.
   *
   * @returns Resolves once saved, or after surfacing a parse error.
   */
  async function onSave(): Promise<void> {
    const parsed = parseJsonObject(draft)
    if (!parsed.ok) return setParseError(parsed.error)
    await save({ ...doc, data: parsed.value })
  }

  /**
   * Delete the document, clear the selection and close the confirmation.
   *
   * @returns Resolves once deleted.
   */
  async function onDelete(): Promise<void> {
    await remove(doc.path)
    setConfirmDelete(false)
    setSelected(null)
  }

  return (
    <section className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 py-2">
        <code className="min-w-0 truncate text-xs text-slate-500 dark:text-slate-400">{selected.path}</code>
        <div className="ml-2 flex shrink-0 items-center gap-2">
          {readOnly && <span className="text-xs text-amber-600 dark:text-amber-400">read-only</span>}
          <Button onClick={() => void onSave()} disabled={busy || readOnly}>
            Save
          </Button>
          <Button variant="danger" onClick={() => setConfirmDelete(true)} disabled={busy || readOnly}>
            Delete
          </Button>
          <Button variant="ghost" onClick={() => setSelected(null)} title="Close editor" aria-label="Close editor">
            ✕
          </Button>
        </div>
      </header>
      <textarea
        spellCheck={false}
        readOnly={readOnly}
        className="flex-1 resize-none bg-white dark:bg-slate-950 dark:text-slate-300 p-4 font-mono text-xs outline-none"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <div className="space-y-1 px-4 pb-3">
        <ErrorBanner message={parseError ?? error} />
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title="Delete document?"
          confirmLabel="Delete"
          danger
          busy={busy}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => void onDelete()}
        >
          <p className="mb-2">This permanently deletes:</p>
          <code className="block break-all rounded bg-slate-100 dark:bg-slate-900 px-2 py-1 text-xs">{doc.path}</code>
          <pre className="mt-2 max-h-40 overflow-auto rounded bg-slate-100 dark:bg-slate-900 p-2 font-mono text-xs">
            {JSON.stringify(doc.data, null, 2)}
          </pre>
        </ConfirmDialog>
      )}
    </section>
  )
}
