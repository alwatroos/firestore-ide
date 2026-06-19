/** Result of parsing user-entered JSON into a document object. */
export type ParseResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; error: string };

/**
 * Parse text into a plain JSON object, rejecting arrays and primitives.
 *
 * @param text - Raw JSON text from the editor.
 * @returns A discriminated parse result with the object or an error message.
 */
export function parseJsonObject(text: string): ParseResult {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Invalid JSON syntax' };
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, error: 'A Firestore document must be a JSON object' };
  }
  return { ok: true, value: value as Record<string, unknown> };
}
