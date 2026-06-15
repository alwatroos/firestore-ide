/**
 * Discriminated result returned across the IPC boundary so the renderer never
 * receives raw `Error` objects (which can leak stack traces or credentials).
 *
 * @template T - The payload type carried by a successful result.
 */
export type Result<T> = { ok: true; data: T } | { ok: false; error: string }
