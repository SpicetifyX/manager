import { ipcMain } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import { tmpdir } from "node:os";
import { unzipSync } from "fflate/node";
import { spicetifyCommand } from "../utils/spicetifyCommand";
import { getSpicetifyExec, getCustomAppsDir } from "../utils/paths";
import { copyDirRecursive } from "../utils/fs-helpers";

export type MarketplaceAppMeta = {
  name: string;
  description?: string;
  imageURL?: string;
  authors?: { name: string; url?: string }[];
  tags?: string[];
  stars?: number;
};

ipcMain.handle(
  "install-marketplace-app",
  async (
    _,
    user: string,
    repo: string,
    appName: string,
    meta?: MarketplaceAppMeta,
  ): Promise<boolean> => {
    let tempDir: string | null = null;
    try {
      console.log(
        `[install-marketplace-app] Installing app "${appName}" from ${user}/${repo}`,
      );

      const apiUrl = `https://api.github.com/repos/${user}/${repo}/releases/latest`;
      const releaseRes = await fetch(apiUrl);
      if (!releaseRes.ok) {
        throw new Error(
          `Failed to fetch latest release: HTTP ${releaseRes.status}`,
        );
      }

      const release = (await releaseRes.json()) as {
        assets: { name: string; browser_download_url: string }[];
        zipball_url: string;
      };

      const zipAsset = release.assets.find((a) =>
        a.name.endsWith(".zip"),
      );
      const archiveUrl = zipAsset
        ? zipAsset.browser_download_url
        : release.zipball_url;

      console.log(
        `[install-marketplace-app] Downloading archive from ${archiveUrl}`,
      );

      const archiveRes = await fetch(archiveUrl);
      if (!archiveRes.ok) {
        throw new Error(
          `Failed to download archive: HTTP ${archiveRes.status}`,
        );
      }

      const buf = Buffer.from(await archiveRes.arrayBuffer());

      tempDir = await fs.mkdtemp(
        path.join(tmpdir(), "spicetifyx-app-"),
      );

      const zipData = new Uint8Array(buf);
      const unzipped = unzipSync(zipData);

      for (const [name, data] of Object.entries(unzipped)) {
        const filePath = path.join(tempDir, name);
        if (name.endsWith("/")) {
          await fs.mkdir(filePath, { recursive: true });
          continue;
        }
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, Buffer.from(data));
      }

      const tempEntries = await fs.readdir(tempDir, { withFileTypes: true });
      const dirs = tempEntries.filter((e) => e.isDirectory());
      let sourceDir = tempDir;
      if (dirs.length === 1 && tempEntries.filter((e) => e.isFile()).length === 0) {
        sourceDir = path.join(tempDir, dirs[0].name);
      }

      const customAppsDir = getCustomAppsDir();
      const destDir = path.join(customAppsDir, appName);
      await fs.mkdir(destDir, { recursive: true });
      await copyDirRecursive(sourceDir, destDir);
      console.log(
        `[install-marketplace-app] Copied app files to ${destDir}`,
      );

      if (meta) {
        const metaPath = path.join(destDir, "app.meta.json");
        await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), "utf-8");
        console.log(`[install-marketplace-app] Saved metadata`);
      }

      const spicetifyExec = getSpicetifyExec();
      await spicetifyCommand(spicetifyExec, [
        "config",
        "custom_apps",
        appName,
      ]);
      console.log(
        `[install-marketplace-app] Enabled ${appName} in config`,
      );

      await spicetifyCommand(spicetifyExec, ["apply"]);
      console.log(`[install-marketplace-app] Applied changes`);

      return true;
    } catch (error) {
      console.error(`[install-marketplace-app] Failed:`, error);
      return false;
    } finally {
      if (tempDir) {
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
        } catch {
        }
      }
    }
  },
);
