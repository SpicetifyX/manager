import { ipcMain } from "electron";
import { spicetifyCommand } from "../utils/spicetifyCommand";
import { getSpicetifyExec, getCustomAppsDir } from "../utils/paths";
import path from "node:path";
import fs from "node:fs/promises";

ipcMain.handle("delete-spicetify-app", async (_, appId: string): Promise<boolean> => {
  try {
    console.log(`[delete-spicetify-app] Deleting app: ${appId}`);
    const spicetifyExec = getSpicetifyExec();

    try {
      await spicetifyCommand(spicetifyExec, ["config", "custom_apps", `${appId}-`]);
      console.log(`[delete-spicetify-app] Disabled app in config.`);
    } catch (error) {
      console.warn(`[delete-spicetify-app] Could not disable app in config (may not have been enabled):`, error);
    }

    const spicetifyCustomAppsPath = getCustomAppsDir();
    const appDirPath = path.join(spicetifyCustomAppsPath, appId);

    try {
      await fs.rm(appDirPath, { recursive: true, force: true });
      console.log(`[delete-spicetify-app] Deleted directory: ${appDirPath}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error(`[delete-spicetify-app] Failed to delete directory:`, error);
      }
    }

    return true;
  } catch (error) {
    console.error(`[delete-spicetify-app] Failed to delete app "${appId}":`, error);
    return false;
  }
});
