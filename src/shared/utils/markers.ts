import { FIELD_MARKERS } from '@shared/types/firestore';

/** The kind of a Firestore type marker (`timestamp`, `geopoint`, …). */
export type MarkerKind = keyof typeof FIELD_MARKERS;

/**
 * Detect whether a plain value is a single-key Firestore type marker.
 *
 * @param value - Candidate value (typically a field read from a document).
 * @returns The marker kind, or `null` when the value is not a marker.
 */
export function markerKind(value: unknown): MarkerKind | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const keys = Object.keys(value);
  if (keys.length !== 1) return null;
  const [key] = keys;
  if (key === FIELD_MARKERS.timestamp) return 'timestamp';
  if (key === FIELD_MARKERS.geopoint) return 'geopoint';
  if (key === FIELD_MARKERS.reference) return 'reference';
  if (key === FIELD_MARKERS.bytes) return 'bytes';
  return null;
}

/**
 * Render a marker value as a compact, human-readable label.
 *
 * @param value - The marker object (must match `kind`).
 * @param kind - The marker kind from {@link markerKind}.
 * @returns A short display string, e.g. `→ users/1` or `geo(1, 2)`.
 */
export function formatMarker(value: Record<string, unknown>, kind: MarkerKind): string {
  if (kind === 'timestamp') return String(value[FIELD_MARKERS.timestamp]);
  if (kind === 'reference') return `→ ${String(value[FIELD_MARKERS.reference])}`;
  if (kind === 'geopoint') {
    const tuple = value[FIELD_MARKERS.geopoint] as [number, number];
    return `geo(${tuple[0]}, ${tuple[1]})`;
  }
  return 'bytes(…)';
}
