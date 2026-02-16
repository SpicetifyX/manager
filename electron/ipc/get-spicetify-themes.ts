import { ipcMain } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import { ThemeInfo } from "../../src/types/theme";
import { getConfigFilePath, getThemesDir } from "../utils/paths";

ipcMain.handle("get-spicetify-themes", async (): Promise<ThemeInfo[]> => {
  try {
    const configPath = getConfigFilePath();

    let currentTheme: string | null = null;
    try {
      const configContent = await fs.readFile(configPath, "utf-8");
      const themeMatch = configContent.match(/^current_theme\s*=\s*(.*)$/m);
      if (themeMatch && themeMatch[1]) {
        currentTheme = themeMatch[1].trim();
      }
    } catch (error) {
      console.warn("Could not read Spicetify config-xpui.ini or current_theme not found:", error);
    }

    const themes: ThemeInfo[] = [];
    const themesDir = getThemesDir();

    try {
      const entries = await fs.readdir(themesDir, { withFileTypes: true });

      for (const dirent of entries) {
        if (!dirent.isDirectory()) continue;

        const themeId = dirent.name;

        const themeDir = path.join(themesDir, themeId);
        let hasUserCss = false;
        let hasColorIni = false;
        try {
          await fs.access(path.join(themeDir, "user.css"));
          hasUserCss = true;
        } catch (e) {
          console.log(e);
        }
        try {
          await fs.access(path.join(themeDir, "color.ini"));
          hasColorIni = true;
        } catch (e) {
          console.log(e);
        }

        if (!hasUserCss && !hasColorIni) continue;

        let meta: any = null;
        try {
          const metaPath = path.join(themeDir, "theme.meta.json");
          const metaContent = await fs.readFile(metaPath, "utf-8");
          meta = JSON.parse(metaContent);
        } catch (e) {
          console.log(e);
        }

        themes.push({
          name: meta?.name || themeId,
          description: meta?.description || "User-installed theme",
          usercss: hasUserCss ? path.join(themeId, "user.css") : undefined,
          schemes: hasColorIni ? [path.join(themeId, "color.ini")] : undefined,
          preview: meta?.imageURL,
          authors: meta?.authors,
          tags: meta?.tags,
          id: themeId,
          isActive: themeId === currentTheme,
          isBundled: false,
        });
      }
    } catch (e) {
      console.log(e);
    }

    return themes;
  } catch (error) {
    console.error("Failed to get Spicetify themes:", error);
    return [];
  }
});
