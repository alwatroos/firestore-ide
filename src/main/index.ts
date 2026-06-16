import { app, BrowserWindow } from 'electron'
import { registerIpc } from './ipc'
import { createMainWindow } from './window'

/**
 * Bootstrap the application once Electron is ready: wire IPC and open a window.
 *
 * @returns Nothing.
 */
function onReady(): void {
  registerIpc()
  createMainWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
}

void app.whenReady().then(onReady)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
