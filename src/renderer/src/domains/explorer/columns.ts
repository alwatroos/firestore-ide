import type { DocumentRecord } from '@shared/types/firestore'

/**
 * Collect a bounded, stable set of column keys across the given documents.
 *
 * @param docs - Documents to inspect.
 * @param max - Maximum number of columns to return.
 * @returns Ordered, de-duplicated field names.
 */
export function collectColumns(docs: DocumentRecord[], max = 8): string[] {
  const keys = new Set<string>()
  for (const doc of docs) {
    for (const key of Object.keys(doc.data)) keys.add(key)
  }
  return [...keys].slice(0, max)
}

/**
 * Format a field value as a compact, human-readable cell string.
 *
 * @param value - The value to format.
 * @returns A display string (objects are JSON-stringified).
 */
export function formatCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
