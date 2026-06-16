import { useState, type ReactNode } from 'react'
import { Button, ErrorBanner } from '../../components/ui'
import { useSettings } from './hooks'

/**
 * Modal-style panel for editing the Ollama host and sampling settings.
 *
 * @param props - `onClose` dismisses the dialog.
 * @returns The rendered settings dialog.
 */
export function SettingsDialog({ onClose }: { onClose: () => void }): ReactNode {
  const { settings, save, error, busy } = useSettings()
  const [host, setHost] = useState(settings.ollamaHost)
  const [sampleSize, setSampleSize] = useState(settings.schemaSampleSize)

  /**
   * Persist the edited settings then close the dialog.
   *
   * @returns Resolves once saved.
   */
  async function onSave(): Promise<void> {
    await save({ ...settings, ollamaHost: host, schemaSampleSize: sampleSize })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40">
      <div className="w-96 space-y-3 rounded-lg bg-white p-5 shadow-xl">
        <h2 className="text-lg font-semibold">Settings</h2>
        <label className="block text-sm">
          Ollama host
          <input
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
            value={host}
            onChange={(event) => setHost(event.target.value)}
          />
        </label>
        <label className="block text-sm">
          Schema sample size
          <input
            type="number"
            min={1}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
            value={sampleSize}
            onChange={(event) => setSampleSize(Number(event.target.value))}
          />
        </label>
        <ErrorBanner message={error} />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void onSave()} disabled={busy}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
