import { BrowserWindow, ipcMain } from "electron";

ipcMain.handle("window-minimize", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.minimize();
});
