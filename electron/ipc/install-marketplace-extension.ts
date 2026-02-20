import { ipcMain } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import { spicetifyCommand } from "../utils/spicetifyCommand";
import { getSpicetifyExec, getExtensionsDir } from "../utils/paths";

export type MarketplaceExtensionMeta = {
  name: string;
  description?: string;
  imageURL?: string;
  authors?: { name: string; url?: string }[];
  tags?: string[];
  stars?: number;
};

ipcMain.handle(
  "install-marketplace-extension",
  async (
    _,
    extensionUrl: string,
    filename: string,
    meta?: MarketplaceExtensionMeta,
  ): Promise<boolean> => {
    try {
      console.log(
        `[install-marketplace-extension] Downloading ${filename} from ${extensionUrl}`,
      );

      const spicetifyExtensionsPath = getExtensionsDir();

      await fs.mkdir(spicetifyExtensionsPath, { recursive: true });

      const response = await fetch(extensionUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to download extension: HTTP ${response.status}`,
        );
      }

      const content = await response.text();
      const destPath = path.join(spicetifyExtensionsPath, filename);
      await fs.writeFile(destPath, content, "utf-8");
      console.log(
        `[install-marketplace-extension] Saved ${filename} to ${destPath}`,
      );

      if (meta) {
        const metaPath = path.join(
          spicetifyExtensionsPath,
          `${filename}.meta.json`,
        );
        await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), "utf-8");
        console.log(
          `[install-marketplace-extension] Saved metadata to ${metaPath}`,
        );
      }

      const spicetifyExec = getSpicetifyExec();

      await spicetifyCommand(spicetifyExec, ["config", "extensions", filename]);
      console.log(
        `[install-marketplace-extension] Enabled ${filename} in config`,
      );

      return true;
    } catch (error) {
      console.error(`[install-marketplace-extension] Failed:`, error);
      return false;
    }
  },
);
