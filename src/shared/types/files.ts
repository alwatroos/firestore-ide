/** A native file-dialog extension filter (e.g. `{ name: 'JSON', extensions: ['json'] }`). */
export interface FileFilter {
  /** Human-readable filter label. */
  name: string
  /** Allowed extensions without the leading dot. */
  extensions: string[]
}

/** Outcome of a save-file dialog. */
export interface SaveFileResult {
  /** True when the user dismissed the dialog. */
  cancelled: boolean
  /** Absolute path written to, when not cancelled. */
  path?: string
}

/** Outcome of an open-file dialog. */
export interface OpenFileResult {
  /** True when the user dismissed the dialog. */
  cancelled: boolean
  /** Base name of the chosen file, when not cancelled. */
  name?: string
  /** UTF-8 contents of the chosen file, when not cancelled. */
  content?: string
}
