import { FIELD_MARKERS } from '@shared/types/firestore'
import { markerKind } from '@shared/utils/markers'
import { DocumentReference, type Firestore, GeoPoint, Timestamp } from 'firebase-admin/firestore'

/**
 * Convert a single Firestore-native value into a JSON-serialisable form so it
 * can safely cross the IPC boundary and render in the UI. Types that JSON
 * cannot express are wrapped in single-key marker objects (see `FIELD_MARKERS`)
 * so they can be revived losslessly by {@link fromPlain}.
 *
 * @param value - Raw value read from Firestore.
 * @returns A plain, JSON-serialisable representation.
 */
export function toPlain(value: unknown): unknown {
  if (value instanceof Timestamp) return { [FIELD_MARKERS.timestamp]: value.toDate().toISOString() }
  if (value instanceof GeoPoint)
    return { [FIELD_MARKERS.geopoint]: [value.latitude, value.longitude] }
  if (value instanceof DocumentReference) return { [FIELD_MARKERS.reference]: value.path }
  if (value instanceof Buffer) return { [FIELD_MARKERS.bytes]: value.toString('base64') }
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

/** A detected marker: its kind and the raw inner value. */
type Marker = { kind: keyof typeof FIELD_MARKERS; value: unknown }

/**
 * Detect whether a plain object is a single-key type marker.
 *
 * @param obj - Candidate object.
 * @returns The marker descriptor, or `null` when it is an ordinary object.
 */
function readMarker(obj: Record<string, unknown>): Marker | null {
  const kind = markerKind(obj)
  if (!kind) return null
  return { kind, value: obj[FIELD_MARKERS[kind]] }
}

/**
 * Revive a detected marker into its Firestore-native value.
 *
 * @param marker - The marker descriptor produced by {@link readMarker}.
 * @param db - Firestore instance (needed to build `DocumentReference`s).
 * @returns The native Firestore value.
 * @throws If a marker's inner value is malformed (e.g. an invalid date).
 */
function reviveMarker(marker: Marker, db: Firestore): unknown {
  if (marker.kind === 'timestamp') {
    const date = new Date(marker.value as string)
    if (Number.isNaN(date.getTime()))
      throw new Error(`Invalid _timestamp value: ${String(marker.value)}`)
    return Timestamp.fromDate(date)
  }
  if (marker.kind === 'geopoint') {
    const tuple = marker.value
    if (
      !Array.isArray(tuple) ||
      tuple.length !== 2 ||
      typeof tuple[0] !== 'number' ||
      typeof tuple[1] !== 'number'
    ) {
      throw new Error('Invalid _geopoint value: expected [latitude, longitude]')
    }
    return new GeoPoint(tuple[0], tuple[1])
  }
  if (marker.kind === 'reference') {
    if (typeof marker.value !== 'string' || marker.value.length === 0) {
      throw new Error('Invalid _ref value: expected a document path string')
    }
    return db.doc(marker.value)
  }
  if (typeof marker.value !== 'string')
    throw new Error('Invalid _bytes value: expected a base64 string')
  return Buffer.from(marker.value, 'base64')
}

/**
 * Convert a plain (JSON) value back into its Firestore-native form, reviving any
 * type markers. The inverse of {@link toPlain}.
 *
 * @param value - Plain value (typically from the editor or an import file).
 * @param db - Firestore instance used to build `DocumentReference`s.
 * @returns A value ready to write to Firestore.
 */
export function fromPlain(value: unknown, db: Firestore): unknown {
  if (Array.isArray(value)) return value.map((item) => fromPlain(item, db))
  if (value && typeof value === 'object') {
    const marker = readMarker(value as Record<string, unknown>)
    if (marker) return reviveMarker(marker, db)
    return unmapObject(value as Record<string, unknown>, db)
  }
  return value
}

/**
 * Recursively revive every entry of a plain object via {@link fromPlain}.
 *
 * @param obj - Source plain object.
 * @param db - Firestore instance for reference markers.
 * @returns A new object with Firestore-native values.
 */
function unmapObject(obj: Record<string, unknown>, db: Firestore): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(obj)) out[key] = fromPlain(val, db)
  return out
}

/**
 * Convert a full plain document back into Firestore-native field values.
 *
 * @param data - Plain document data (from editor or import).
 * @param db - Firestore instance for reference markers.
 * @returns Field map ready to persist with the Firestore SDK.
 */
export function fromPlainData(
  data: Record<string, unknown>,
  db: Firestore
): Record<string, unknown> {
  return unmapObject(data, db)
}
