import { useAtom } from 'jotai'
import { type ReactNode, useEffect, useState } from 'react'
import { Button, Empty, ErrorBanner } from '../../components/ui'
import { parseJsonObject } from '../../lib/json'
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
   * Delete the document and clear the selection.
   *
   * @returns Resolves once deleted.
   */
  async function onDelete(): Promise<void> {
    await remove(doc.path)
    setSelected(null)
  }

  return (
    <section className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 py-2">
        <code className="min-w-0 truncate text-xs text-slate-500 dark:text-slate-400">{selected.path}</code>
        <div className="ml-2 flex shrink-0 gap-2">
          <Button onClick={() => void onSave()} disabled={busy}>
            Save
          </Button>
          <Button variant="danger" onClick={() => void onDelete()} disabled={busy}>
            Delete
          </Button>
          <Button variant="ghost" onClick={() => setSelected(null)} title="Close editor" aria-label="Close editor">
            ✕
          </Button>
        </div>
      </header>
      <textarea
        spellCheck={false}
        className="flex-1 resize-none bg-white dark:bg-slate-950 dark:text-slate-300 p-4 font-mono text-xs outline-none"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <div className="space-y-1 px-4 pb-3">
        <ErrorBanner message={parseError ?? error} />
      </div>
    </section>
  )
}
