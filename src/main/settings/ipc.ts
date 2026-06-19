import { IPC } from '@shared/ipc/channels';
import type { AppSettings } from '@shared/types/settings';
import { ok } from '@shared/utils/result';
import { handle } from '../core/ipc';
import { loadSettings, saveSettings } from './store';

/**
 * Register all settings-domain IPC handlers.
 *
 * @returns Nothing; side-effect registers handlers on `ipcMain`.
 */
export function registerSettingsIpc(): void {
  handle(IPC.settingsGet, async () => ok(await loadSettings()));
  handle(IPC.settingsSave, async (settings: AppSettings) => ok(await saveSettings(settings)));
}
