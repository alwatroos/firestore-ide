import type { DocumentRecord } from '@shared/types/firestore'
import { collectColumns, formatCell } from './columns'

/**
 * Serialise document records to pretty-printed JSON. The shape (id, path, data)
 * round-trips back through import.
 *
 * @param records - Documents to export.
 * @returns A JSON string.
 */
export function toJson(records: DocumentRecord[]): string {
  return JSON.stringify(records, null, 2)
}

/**
 * Escape a single CSV cell, quoting when it contains a comma, quote or newline.
 *
 * @param value - The already-stringified cell value.
 * @returns A CSV-safe cell.
 */
function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

/**
 * Serialise document records to CSV. Columns are the union of field names;
 * special types and nested values are rendered the same way as table cells.
 *
 * @param records - Documents to export.
 * @returns A CSV string with an `id` column followed by field columns.
 */
export function toCsv(records: DocumentRecord[]): string {
  const columns = collectColumns(records, Number.MAX_SAFE_INTEGER)
  const header = ['id', ...columns].map(csvCell).join(',')
  const rows = records.map((record) =>
    [record.id, ...columns.map((col) => formatCell(record.data[col]))].map(csvCell).join(',')
  )
  return [header, ...rows].join('\n')
}
