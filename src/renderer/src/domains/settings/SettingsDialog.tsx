import type { Theme } from '@shared/types/settings'
import { type ReactNode, useState } from 'react'
import { Button, ErrorBanner } from '../../components/ui'
import { useSettings } from './hooks'

const THEME_LABELS: Record<Theme, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark'
}

/**
 * Modal-style panel for editing Ollama host, sampling settings and the UI theme.
 *
 * @param props - `onClose` dismisses the dialog.
 * @returns The rendered settings dialog.
 */
export function SettingsDialog({ onClose }: { onClose: () => void }): ReactNode {
  const { settings, save, error, busy } = useSettings()
  const [host, setHost] = useState(settings.ollamaHost)
  const [sampleSize, setSampleSize] = useState(settings.schemaSampleSize)
  const [theme, setTheme] = useState<Theme>(settings.theme)

  /**
   * Persist the edited settings then close the dialog.
   *
   * @returns Resolves once saved.
   */
  async function onSave(): Promise<void> {
    await save({ ...settings, ollamaHost: host, schemaSampleSize: sampleSize, theme })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40">
      <div className="w-96 space-y-3 rounded-lg bg-white dark:bg-slate-800 p-5 shadow-xl">
        <h2 className="text-lg font-semibold dark:text-slate-200">Settings</h2>
        <label className="block text-sm dark:text-slate-300">
          Ollama host
          <input
            className="mt-1 w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-slate-200 px-2 py-1"
            value={host}
            onChange={(event) => setHost(event.target.value)}
          />
        </label>
        <label className="block text-sm dark:text-slate-300">
          Schema sample size
          <input
            type="number"
            min={1}
            className="mt-1 w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-slate-200 px-2 py-1"
            value={sampleSize}
            onChange={(event) => setSampleSize(Number(event.target.value))}
          />
        </label>
        <div className="block text-sm dark:text-slate-300">
          Theme
          <div className="mt-1 flex gap-2">
            {(['system', 'light', 'dark'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`flex-1 rounded border px-3 py-1.5 text-xs font-medium transition-colors ${
                  theme === t
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                    : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {THEME_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
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
