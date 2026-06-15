import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Button, ErrorBanner } from '../../components/ui'
import { useConnectionActions, useRefreshConnections } from './hooks'

/**
 * Form for importing a new connection from a service account key file.
 *
 * @returns The rendered form.
 */
export function AddConnectionForm(): ReactNode {
  const [name, setName] = useState('')
  const [json, setJson] = useState('')
  const refresh = useRefreshConnections()
  const { add, busy, error } = useConnectionActions(refresh)

  /**
   * Read a chosen JSON key file into state, defaulting the name from it.
   *
   * @param event - File input change event.
   * @returns Resolves once the file has been read.
   */
  async function onFile(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0]
    if (!file) return
    setJson(await file.text())
    if (!name) setName(file.name.replace(/\.json$/i, ''))
  }

  /**
   * Submit the form, then reset the sensitive fields.
   *
   * @param event - Form submit event.
   * @returns Resolves once the connection has been added.
   */
  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    await add({ name: name.trim(), serviceAccountJson: json })
    setName('')
    setJson('')
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2 border-t border-slate-200 p-3">
      <input
        className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
        placeholder="Connection name"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <input type="file" accept="application/json,.json" onChange={onFile} className="text-xs" />
      <ErrorBanner message={error} />
      <Button type="submit" disabled={busy || !name.trim() || !json}>
        Add connection
      </Button>
    </form>
  )
}
