import { ipcMain } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import { spicetifyCommand } from "../utils/spicetifyCommand";
import { getSpicetifyExec, getThemesDir } from "../utils/paths";
import { ThemeManifestEntry } from "../../src/types/theme";

ipcMain.handle("apply-spicetify-theme", async (_, themeId: string): Promise<boolean> => {
  try {
    console.log(`[apply-spicetify-theme] Attempting to apply theme: ${themeId}`);

    const spicetifyExec = getSpicetifyExec();
    const spicetifyThemesPath = getThemesDir();

    try {
      const themesManifestPath = path.join(process.env.APP_PATH, "themes", "manifest.json");
      const manifestContent = await fs.readFile(themesManifestPath, "utf-8");
      const themesManifest: ThemeManifestEntry[] = JSON.parse(manifestContent);

      const themeEntry = themesManifest.find((t) => {
        const tid = path.dirname(t.usercss || t.schemes![0] || (t.include && t.include[0]) || t.name);
        return tid === themeId;
      });

      if (themeEntry) {
        const destThemeDir = path.join(spicetifyThemesPath, themeId);
        await fs.mkdir(destThemeDir, { recursive: true });

        const copyFile = async (relativePath: string | undefined) => {
          if (!relativePath) return;
          if (relativePath.startsWith("http")) return;
          const src = path.join(process.env.APP_PATH, "themes", relativePath);
          const dest = path.join(spicetifyThemesPath, relativePath);
          await fs.mkdir(path.dirname(dest), { recursive: true });
          try {
            await fs.copyFile(src, dest);
          } catch (e) {
            console.warn(`[apply-spicetify-theme] Could not copy ${relativePath}:`, e);
          }
        };

        await copyFile(themeEntry.usercss);
        await copyFile(themeEntry.schemes![0]);
        if (themeEntry.include) {
          for (const inc of themeEntry.include) {
            await copyFile(inc);
          }
        }
        console.log(`[apply-spicetify-theme] Theme files for "${themeId}" copied to ${destThemeDir}`);
      }
    } catch (err) {
      console.warn(`[apply-spicetify-theme] Could not migrate theme files:`, err);
    }

    await spicetifyCommand(spicetifyExec, ["config", "current_theme", themeId]);

    const colorIniPath = path.join(spicetifyThemesPath, themeId, "color.ini");

    let firstScheme = "";
    try {
      const colorIni = await fs.readFile(colorIniPath, "utf-8");
      const schemeMatch = colorIni.match(/^\[(.+)\]/m);
      if (schemeMatch && schemeMatch[1]) {
        firstScheme = schemeMatch[1].trim();
        console.log(`[apply-spicetify-theme] Found first color scheme: "${firstScheme}"`);
      }
    } catch (e) {
      console.log(e);
      console.log(`[apply-spicetify-theme] No color.ini found for ${themeId}, using empty scheme`);
    }

    await spicetifyCommand(spicetifyExec, ["config", "color_scheme", firstScheme]);

    await spicetifyCommand(spicetifyExec, ["apply"]);
    console.log(`[apply-spicetify-theme] Theme ${themeId} applied successfully.`);

    return true;
  } catch (error) {
    console.error(`[apply-spicetify-theme] Failed to apply theme ${themeId}:`, error);
    return false;
  }
});
