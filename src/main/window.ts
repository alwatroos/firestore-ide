import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BrowserWindow, shell } from 'electron';

const moduleDir = dirname(fileURLToPath(import.meta.url));

/**
 * Build hardened `webPreferences` for the main window.
 *
 * @returns Web preferences enforcing context isolation and a preload bridge.
 */
function buildPreferences(): Electron.WebPreferences {
  return {
    preload: join(moduleDir, '../preload/index.mjs'),
    sandbox: false,
    contextIsolation: true,
    nodeIntegration: false,
  };
}

/**
 * Load either the Vite dev server (in development) or the built renderer.
 *
 * @param window - The window to load content into.
 * @returns Nothing; triggers an asynchronous load.
 */
function loadContent(window: BrowserWindow): void {
  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (devUrl) void window.loadURL(devUrl);
  else void window.loadFile(join(moduleDir, '../renderer/index.html'));
}

/**
 * Create, configure and show the application's main window.
 *
 * @returns The created {@link BrowserWindow}.
 */
export function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    show: false,
    autoHideMenuBar: true,
    webPreferences: buildPreferences(),
  });
  window.on('ready-to-show', () => window.show());
  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });
  loadContent(window);
  return window;
}
