import { ipcMain } from "electron";
import { spicetifyCommand } from "../utils/spicetifyCommand";
import { getSpicetifyExec, getExtensionsDir } from "../utils/paths";
import path from "node:path";
import fs from "node:fs/promises";

ipcMain.handle("delete-spicetify-extension", async (_, addonFileName: string): Promise<boolean> => {
  try {
    console.log(`[delete-spicetify-extension] Deleting extension: ${addonFileName}`);
    const spicetifyExec = getSpicetifyExec();

    try {
      await spicetifyCommand(spicetifyExec, ["config", "extensions", `${addonFileName}-`]);
      console.log(`[delete-spicetify-extension] Disabled extension in config.`);
    } catch (e) {
      console.warn(`[delete-spicetify-extension] Could not disable extension in config (may not have been enabled):`, e);
    }

    const spicetifyExtensionsPath = getExtensionsDir();

    const extFilePath = path.join(spicetifyExtensionsPath, addonFileName);
    try {
      await fs.unlink(extFilePath);
      console.log(`[delete-spicetify-extension] Deleted file: ${extFilePath}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error(`[delete-spicetify-extension] Failed to delete file:`, error);
      }
    }

    const metaFilePath = path.join(spicetifyExtensionsPath, `${addonFileName}.meta.json`);
    try {
      await fs.unlink(metaFilePath);
    } catch (e) {
      console.log(e);
    }

    return true;
  } catch (error) {
    console.error(`[delete-spicetify-extension] Failed to delete extension "${addonFileName}":`, error);
    return false;
  }
});
