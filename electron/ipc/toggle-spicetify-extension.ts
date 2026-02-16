import { ipcMain } from "electron";
import { spicetifyCommand } from "../utils/spicetifyCommand";
import { getSpicetifyExec, getExtensionsDir } from "../utils/paths";
import path from "node:path";
import fs from "node:fs/promises";

ipcMain.handle(
  "toggle-spicetify-extension",
  async (_, addonFileName: string, enable: boolean): Promise<boolean> => {
    try {
      const spicetifyExec = getSpicetifyExec();

      if (enable) {
        const spicetifyExtensionsPath = getExtensionsDir();

        await fs.mkdir(spicetifyExtensionsPath, { recursive: true });

        const extensionsManifestPath = path.join(
          process.env.APP_PATH,
          "extensions",
          "manifest.json",
        );
        try {
          const manifestContent = await fs.readFile(
            extensionsManifestPath,
            "utf-8",
          );
          const manifestEntries = JSON.parse(manifestContent);
          for (const ext of manifestEntries) {
            if (path.basename(ext.main) === addonFileName) {
              const srcFile = path.join(
                process.env.APP_PATH,
                "extensions",
                ext.main,
              );
              const destFile = path.join(
                spicetifyExtensionsPath,
                addonFileName,
              );
              await fs.copyFile(srcFile, destFile);
              console.log(
                `[toggle-spicetify-extension] Copied ${addonFileName} to ${destFile}`,
              );
              break;
            }
          }
        } catch (error) {
          console.warn(
            `[toggle-spicetify-extension] Could not copy extension file:`,
            error,
          );
        }
      }

      const commandArgs = enable ? [addonFileName] : [`${addonFileName}-`];

      await spicetifyCommand(spicetifyExec, [
        "config",
        "extensions",
        ...commandArgs,
      ]);
      await spicetifyCommand(spicetifyExec, ["apply"]);

      return true;
    } catch (error) {
      console.error(
        `[toggle-spicetify-extension] Failed to toggle extension`,
        error,
      );
      return false;
    }
  },
);
