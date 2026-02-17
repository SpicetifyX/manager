import { ipcMain } from "electron";
import assets from "../../assets.json";
import { getSpicetifyConfigDir } from "../utils/paths";
import { copyDirRecursive } from "../utils/fs-helpers";
import fs from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { unzipSync } from "fflate/node";

ipcMain.handle("setup-spicetify-assets", async () => {
  console.log(assets.themes);

  const spicetifyPath = getSpicetifyConfigDir();

  for (const theme of assets.themes) {
    await fs.mkdir(path.join(spicetifyPath, "Themes", theme.name), { recursive: true });

    await Promise.all(
      theme.raw_files.map(async (fileUrl) => {
        const filePath = fileUrl.split("/")[fileUrl.split("/").length - 1].split("?")[0];
        console.log(`Downloading theme asset: ${fileUrl}, name: ${filePath}`);
        const resp = await fetch(fileUrl, { method: "get" });
        await fs.writeFile(path.join(spicetifyPath, "Themes", theme.name, filePath), await resp.text());
      }),
    );

    if (theme.raw_meta_content) {
      await fs.writeFile(path.join(spicetifyPath, "Themes", theme.name, "theme.meta.json"), JSON.stringify(theme.raw_meta_content));
    } else {
      const resp = await fetch(theme.raw_meta_url!, { method: "get" });
      await fs.writeFile(path.join(spicetifyPath, "Themes", theme.name, "theme.meta.json"), await resp.text());
    }
  }

  for (const extension of assets.extensions) {
    await fs.mkdir(path.join(spicetifyPath, "Extensions"), { recursive: true });

    await Promise.all(
      extension.raw_files.map(async (fileUrl) => {
        const filePath = fileUrl.split("/")[fileUrl.split("/").length - 1].split("?")[0];
        console.log(`Downloading theme asset: ${fileUrl}, name: ${filePath}`);
        const resp = await fetch(fileUrl, { method: "get" });
        await fs.writeFile(path.join(spicetifyPath, "Extensions", filePath), await resp.text());
      }),
    );

    if (extension.raw_meta_content) {
      await fs.writeFile(path.join(spicetifyPath, "Extensions", `${extension.file_name}.meta.json`), JSON.stringify(extension.raw_meta_content));
    } else {
      const resp = await fetch(extension.raw_meta_url!, { method: "get" });
      await fs.writeFile(path.join(spicetifyPath, "Extensions", `${extension.file_name}.meta.json`), await resp.text());
    }
  }

  for (const app of (assets as any).apps || []) {
    if (!app.raw_archive_url) continue;

    console.log(`Downloading app archive: ${app.name} from ${app.raw_archive_url}`);
    const archiveResp = await fetch(app.raw_archive_url, { method: "get" });
    const buf = Buffer.from(await archiveResp.arrayBuffer());

    const tempDir = await fs.mkdtemp(path.join(tmpdir(), "spicetifyx-app-"));

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

    const destDir = path.join(spicetifyPath, "CustomApps", app.name);
    await fs.mkdir(destDir, { recursive: true });
    await copyDirRecursive(sourceDir, destDir);

    if (app.raw_meta_content) {
      await fs.writeFile(path.join(destDir, "app.meta.json"), JSON.stringify(app.raw_meta_content));
    } else if (app.raw_meta_url) {
      const metaResp = await fetch(app.raw_meta_url, { method: "get" });
      await fs.writeFile(path.join(destDir, "app.meta.json"), await metaResp.text());
    }

    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (e) {
      console.error(`Failed to remove temporary directory ${tempDir}:`, e);
    }

    console.log(`App "${app.name}" installed to ${destDir}`);
  }
});
