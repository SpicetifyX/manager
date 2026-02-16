import { ipcMain } from "electron";
import assets from "../../assets.json";
import { getSpicetifyConfigDir } from "../utils/paths";
import fs from "node:fs/promises";
import path from "node:path";

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
});
