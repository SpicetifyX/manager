import { ipcMain } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import { spicetifyCommand } from "../utils/spicetifyCommand";
import { getSpicetifyExec, getThemesDir } from "../utils/paths";

export type MarketplaceThemeMeta = {
  name: string;
  description?: string;
  imageURL?: string;
  authors?: { name: string; url?: string }[];
  tags?: string[];
  stars?: number;
};

async function downloadFile(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: HTTP ${response.status}`);
  }
  return response.text();
}

ipcMain.handle(
  "install-marketplace-theme",
  async (
    _,
    themeId: string,
    cssURL: string,
    schemesURL?: string,
    include?: string[],
    meta?: MarketplaceThemeMeta,
  ): Promise<boolean> => {
    try {
      console.log(
        `[install-marketplace-theme] Installing theme "${themeId}" from ${cssURL}`,
      );

      const themesDir = getThemesDir();
      const destThemeDir = path.join(themesDir, themeId);
      await fs.mkdir(destThemeDir, { recursive: true });

      const cssContent = await downloadFile(cssURL);
      await fs.writeFile(
        path.join(destThemeDir, "user.css"),
        cssContent,
        "utf-8",
      );
      console.log(`[install-marketplace-theme] Saved user.css`);

      if (schemesURL) {
        const schemesContent = await downloadFile(schemesURL);
        await fs.writeFile(
          path.join(destThemeDir, "color.ini"),
          schemesContent,
          "utf-8",
        );
        console.log(`[install-marketplace-theme] Saved color.ini`);
      }

      if (include && include.length > 0) {
        for (const includeURL of include) {
          if (!includeURL.startsWith("http")) {
            console.warn(
              `[install-marketplace-theme] Skipping non-URL include: ${includeURL}`,
            );
            continue;
          }
          const filename = path.basename(new URL(includeURL).pathname);
          const includeContent = await downloadFile(includeURL);
          await fs.writeFile(
            path.join(destThemeDir, filename),
            includeContent,
            "utf-8",
          );
          console.log(
            `[install-marketplace-theme] Saved include file: ${filename}`,
          );
        }
      }

      if (meta) {
        const metaPath = path.join(destThemeDir, "theme.meta.json");
        await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), "utf-8");
        console.log(`[install-marketplace-theme] Saved metadata`);
      }

      const spicetifyExec = getSpicetifyExec();
      await spicetifyCommand(spicetifyExec, [
        "config",
        "current_theme",
        themeId,
      ]);

      let firstScheme = "";
      try {
        const colorIniPath = path.join(destThemeDir, "color.ini");
        const colorIni = await fs.readFile(colorIniPath, "utf-8");
        const schemeMatch = colorIni.match(/^\[(.+)\]/m);
        if (schemeMatch && schemeMatch[1]) {
          firstScheme = schemeMatch[1].trim();
          console.log(
            `[install-marketplace-theme] Using color scheme: "${firstScheme}"`,
          );
        }
      } catch {
        console.log(
          `[install-marketplace-theme] No color.ini, using empty scheme`,
        );
      }

      await spicetifyCommand(spicetifyExec, [
        "config",
        "color_scheme",
        firstScheme,
      ]);
      console.log(
        `[install-marketplace-theme] Theme "${themeId}" installed and configured successfully`,
      );

      return true;
    } catch (error) {
      console.error(`[install-marketplace-theme] Failed:`, error);
      return false;
    }
  },
);
