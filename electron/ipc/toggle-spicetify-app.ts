import { ipcMain } from "electron";
import { spicetifyCommand } from "../utils/spicetifyCommand";
import { getSpicetifyExec, getCustomAppsDir } from "../utils/paths";
import { copyDirRecursive } from "../utils/fs-helpers";
import path from "node:path";
import fs from "node:fs/promises";

ipcMain.handle(
  "toggle-spicetify-app",
  async (_, appId: string, enable: boolean): Promise<boolean> => {
    try {
      const spicetifyExec = getSpicetifyExec();

      if (enable) {
        const spicetifyCustomAppsPath = getCustomAppsDir();

        const srcAppDir = path.join(process.env.APP_PATH, "apps", appId);
        const destAppDir = path.join(spicetifyCustomAppsPath, appId);
        await fs.mkdir(destAppDir, { recursive: true });

        try {
          await copyDirRecursive(srcAppDir, destAppDir);
        } catch (error) {
          console.error(
            `[toggle-spicetify-app] Failed to copy app files for "${appId}":`,
            error,
          );
        }
      }

      const commandArgs = enable ? [appId] : [`${appId}-`];

      await spicetifyCommand(spicetifyExec, [
        "config",
        "custom_apps",
        ...commandArgs,
      ]);
      await spicetifyCommand(spicetifyExec, ["apply"]);

      return true;
    } catch (error) {
      console.error(
        `[toggle-spicetify-app] Failed to toggle app "${appId}":`,
        error,
      );
      return false;
    }
  },
);
