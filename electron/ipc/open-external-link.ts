import { ipcMain, shell } from "electron";

ipcMain.handle("open-external-link", async (_, url: string) => {
  try {
    await shell.openExternal(url);
    return true;
  } catch (error) {
    console.error("Failed to open external link:", error);
    return false;
  }
});
