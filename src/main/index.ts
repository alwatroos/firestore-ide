import { app, BrowserWindow, safeStorage } from 'electron';
import { registerIpc } from './ipc';
import { createMainWindow } from './window';

// Prevent Chromium from using mDNS hostnames for WebRTC ICE candidates.
// Without this flag, Chromium queries mDNS on startup, which triggers the
// macOS "Local Network" permission dialog even though the app never uses WebRTC.
app.commandLine.appendSwitch('disable-features', 'WebRtcHideLocalIpsWithMdns');

/**
 * Bootstrap the application once Electron is ready: wire IPC and open a window.
 *
 * @returns Nothing.
 */
function onReady(): void {
  // Prime safeStorage early so the Keychain access prompt appears once at
  // startup rather than mid-workflow when the user first adds or uses a connection.
  if (safeStorage.isEncryptionAvailable()) {
    safeStorage.encryptString('init');
  }
  registerIpc();
  createMainWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
}

void app.whenReady().then(onReady);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
