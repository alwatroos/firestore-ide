import { useCallback, useState } from 'react';

/** State and runner returned by {@link useAsync}. */
interface AsyncState {
  /** Last error message, or `null`. */
  error: string | null;
  /** Whether an async action is in flight. */
  busy: boolean;
  /** Run an async function, tracking busy state and capturing errors. */
  run: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
  /** Manually set or clear the error. */
  setError: (message: string | null) => void;
}

/**
 * Provide standard busy/error handling for asynchronous UI actions.
 *
 * @returns Async state plus a `run` wrapper that captures thrown errors.
 */
export function useAsync(): AsyncState {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = useCallback(async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unexpected error');
      return undefined;
    } finally {
      setBusy(false);
    }
  }, []);
  return { error, busy, run, setError };
}
