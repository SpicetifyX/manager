import { ipcMain } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import { unzipSync } from "fflate/node";
import { spicetifyCommand } from "../utils/spicetifyCommand";
import { getSpicetifyExec, getCustomAppsDir } from "../utils/paths";

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
    branch?: string,
    meta?: MarketplaceAppMeta,
  ): Promise<boolean> => {
    try {
      console.log(
        `[install-marketplace-app] Installing app "${appName}" from ${user}/${repo}`,
      );

      let archiveUrl: string;

      const apiUrl = `https://api.github.com/repos/${user}/${repo}/releases/latest`;
      const releaseRes = await fetch(apiUrl);

      if (releaseRes.ok) {
        const release = (await releaseRes.json()) as {
          assets: { name: string; browser_download_url: string }[];
          zipball_url: string;
        };

        const zipAsset = release.assets.find((a) =>
          a.name.endsWith(".zip"),
        );
        archiveUrl = zipAsset
          ? zipAsset.browser_download_url
          : release.zipball_url;
        console.log(
          `[install-marketplace-app] Using release archive`,
        );
      } else {
        console.log(
          `[install-marketplace-app] No release found, scanning branches for built .js files`,
        );

        const branchesRes = await fetch(
          `https://api.github.com/repos/${user}/${repo}/branches`,
        );
        if (!branchesRes.ok) {
          throw new Error(
            `Failed to fetch branches: HTTP ${branchesRes.status}`,
          );
        }
        const branches = (await branchesRes.json()) as { name: string }[];

        let foundBranch: string | null = null;
        for (const b of branches) {
          const treeRes = await fetch(
            `https://api.github.com/repos/${user}/${repo}/git/trees/${b.name}?recursive=1`,
          );
          if (!treeRes.ok) continue;
          const tree = (await treeRes.json()) as {
            tree: { path: string; type: string }[];
          };
          const hasJs = tree.tree.some(
            (entry) =>
              entry.type === "blob" && entry.path.endsWith(".js"),
          );
          if (hasJs) {
            foundBranch = b.name;
            console.log(
              `[install-marketplace-app] Found .js files in branch "${b.name}"`,
            );
            break;
          }
        }

        if (!foundBranch) {
          throw new Error(
            `No release and no branch with built .js files found in ${user}/${repo}`,
          );
        }

        archiveUrl = `https://api.github.com/repos/${user}/${repo}/zipball/${foundBranch}`;
      }

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

      const customAppsDir = getCustomAppsDir();
      const destDir = path.join(customAppsDir, appName);
      await fs.mkdir(destDir, { recursive: true });

      let jsFileCount = 0;
      for (const [name, data] of Object.entries(unzipped)) {
        if (name.endsWith("/")) continue;
        const basename = path.basename(name);
        if (!basename.endsWith(".js")) continue;
        await fs.writeFile(path.join(destDir, basename), Buffer.from(data));
        jsFileCount++;
      }

      if (jsFileCount === 0) {
        throw new Error("No .js files found in the archive");
      }

      console.log(
        `[install-marketplace-app] Copied ${jsFileCount} .js files to ${destDir}`,
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
    }
  },
);
