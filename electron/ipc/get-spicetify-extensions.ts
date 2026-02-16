import { ipcMain } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import { AddonInfo } from "../../src/types/addon";
import { getConfigFilePath, getExtensionsDir } from "../utils/paths";

ipcMain.handle("get-spicetify-extensions", async (): Promise<AddonInfo[]> => {
  try {
    const configPath = getConfigFilePath();

    let enabledExtensions: string[] = [];
    try {
      const configContent = await fs.readFile(configPath, "utf-8");
      const extensionsMatch = configContent.match(/^extensions\s*=\s*(.*)$/m);

      if (extensionsMatch && extensionsMatch[1]) {
        enabledExtensions = extensionsMatch[1]
          .split("|")
          .map((ext) => ext.trim())
          .filter((ext) => ext !== "");
      }
    } catch (error) {
      console.warn(
        "[get-spicetify-extensions] Could not read Spicetify config-xpui.ini or extensions not found (this might be normal if no extensions are configured yet):",
        error,
      );
    }

    const extensionsDir = getExtensionsDir();
    const addons: AddonInfo[] = [];

    try {
      const files = await fs.readdir(extensionsDir);
      for (const file of files) {
        if (!file.endsWith(".js")) continue;

        const nameWithoutExt = path.basename(file, ".js");
        const isEnabled = enabledExtensions.includes(file) || enabledExtensions.includes(nameWithoutExt);

        let meta: {
          name?: string;
          description?: string;
          imageURL?: string;
          authors?: { name: string; url?: string }[];
          tags?: string[];
        } = {};
        try {
          const metaPath = path.join(extensionsDir, `${file}.meta.json`);
          const metaContent = await fs.readFile(metaPath, "utf-8");
          meta = JSON.parse(metaContent);
        } catch (e) {
          console.log(e);
        }

        addons.push({
          name: meta.name || nameWithoutExt,
          description: meta.description || "User-installed extension",
          preview: meta.imageURL,
          main: file,
          id: nameWithoutExt,
          addonFileName: file,
          isEnabled: isEnabled,
          authors: meta.authors,
          tags: meta.tags,
        });
      }
    } catch (e) {
      console.log(e);
    }

    return addons;
  } catch (error) {
    console.error("[get-spicetify-extensions] Failed to get Spicetify extensions:", error);
    return [];
  }
});
