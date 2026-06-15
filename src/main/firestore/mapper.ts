import { DocumentReference, GeoPoint, Timestamp } from 'firebase-admin/firestore'

/**
 * Convert a single Firestore-native value into a JSON-serialisable form so it
 * can safely cross the IPC boundary and render in the UI.
 *
 * @param value - Raw value read from Firestore.
 * @returns A plain, JSON-serialisable representation.
 */
export function toPlain(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (value instanceof GeoPoint) return { _geopoint: [value.latitude, value.longitude] }
  if (value instanceof DocumentReference) return { _ref: value.path }
  if (value instanceof Buffer) return { _bytes: value.toString('base64') }
  if (Array.isArray(value)) return value.map(toPlain)
  if (value && typeof value === 'object') return mapObject(value as Record<string, unknown>)
  return value
}

/**
 * Recursively convert every entry of a plain object via {@link toPlain}.
 *
 * @param obj - Source object.
 * @returns A new object with converted values.
 */
function mapObject(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(obj)) out[key] = toPlain(val)
  return out
}

/**
 * Convert a full document's fields to a JSON-serialisable record.
 *
 * @param data - Raw document data from Firestore.
 * @returns Plain field map ready for the renderer.
 */
export function toPlainData(data: Record<string, unknown>): Record<string, unknown> {
  return mapObject(data)
}
