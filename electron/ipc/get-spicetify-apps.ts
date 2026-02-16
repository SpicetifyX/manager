import { ipcMain } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import { AppInfo, AppManifest } from "../../src/types/app";
import { getConfigFilePath, getCustomAppsDir } from "../utils/paths";

ipcMain.handle("get-spicetify-apps", async (): Promise<AppInfo[]> => {
  try {
    const configPath = getConfigFilePath();

    let enabledApps: string[] = [];
    try {
      const configContent = await fs.readFile(configPath, "utf-8");
      const appsMatch = configContent.match(/^custom_apps\s*=\s*(.*)$/m);

      if (appsMatch && appsMatch[1]) {
        enabledApps = appsMatch[1]
          .split("|")
          .map((app) => app.trim())
          .filter((app) => app !== "");
      }
    } catch (error) {
      console.warn("[get-spicetify-apps] Could not read config-xpui.ini:", error);
    }

    const installedApps: AppInfo[] = [];
    const knownAppIds = new Set<string>();
    const customAppsDir = getCustomAppsDir();

    try {
      const entries = await fs.readdir(customAppsDir, { withFileTypes: true });

      for (const dirent of entries) {
        if (!dirent.isDirectory()) continue;

        const appId = dirent.name;
        if (knownAppIds.has(appId.toLowerCase())) continue;

        const isEnabled = enabledApps.includes(appId);
        const manifestPath = path.join(customAppsDir, appId, "manifest.json");

        let appInfo: AppInfo;
        try {
          const manifestContent = await fs.readFile(manifestPath, "utf-8");
          const manifest: AppManifest = JSON.parse(manifestContent);
          appInfo = { ...manifest, id: appId, isEnabled };
        } catch (e) {
          console.log(e);

          appInfo = {
            name: appId,
            icon: "",
            activeIcon: "",
            subfiles: [],
            subfiles_extension: [],
            id: appId,
            isEnabled,
          };
        }

        installedApps.push(appInfo);
      }
    } catch (e) {
      console.log(e);
    }

    return installedApps;
  } catch (error) {
    console.error("[get-spicetify-apps] Failed to get Spicetify apps:", error);
    return [];
  }
});
