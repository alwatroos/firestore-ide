import { IPC } from '@shared/ipc/channels';
import { ok } from '@shared/utils/result';
import { handle } from '../core/ipc';
import { getActiveRules } from './service';

/**
 * Register Security Rules IPC handlers.
 *
 * @returns Nothing; side-effect registers handlers on `ipcMain`.
 */
export function registerRulesIpc(): void {
  handle(IPC.rulesGetActive, async (id: string) => ok(await getActiveRules(id)));
}
