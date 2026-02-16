import { BrowserWindow, ipcMain } from "electron";

ipcMain.handle("window-close", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.close();
});
