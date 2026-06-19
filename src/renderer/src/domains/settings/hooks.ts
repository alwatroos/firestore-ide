import type { AppSettings } from '@shared/types/settings';
import { useAtom } from 'jotai';
import { useCallback, useEffect } from 'react';
import { api, unwrap } from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { settingsAtom } from './atoms';

/**
 * Load persisted settings on mount and expose a save action.
 *
 * @returns Current settings, a save action and busy/error state.
 */
export function useSettings() {
  const [settings, setSettings] = useAtom(settingsAtom);
  const { error, busy, run } = useAsync();
  const refresh = useCallback(
    () => run(async () => setSettings(await unwrap(api.getSettings()))),
    [run, setSettings]
  );
  const save = useCallback(
    (next: AppSettings) => run(async () => setSettings(await unwrap(api.saveSettings(next)))),
    [run, setSettings]
  );
  useEffect(() => void refresh(), [refresh]);
  return { settings, save, error, busy };
}
