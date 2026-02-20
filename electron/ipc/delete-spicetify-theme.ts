import { ipcMain } from "electron";
import { spicetifyCommand } from "../utils/spicetifyCommand";
import { getSpicetifyExec, getThemesDir, getConfigFilePath } from "../utils/paths";
import path from "node:path";
import fs from "node:fs/promises";

ipcMain.handle("delete-spicetify-theme", async (_, themeId: string): Promise<boolean> => {
  try {
    console.log(`[delete-spicetify-theme] Deleting theme: ${themeId}`);
    const spicetifyExec = getSpicetifyExec();
    const themesDir = getThemesDir();

    try {
      const configContent = await fs.readFile(getConfigFilePath(), "utf-8");
      const themeMatch = configContent.match(/^current_theme\s*=\s*(.*)$/m);
      const currentTheme = themeMatch?.[1]?.trim();

      if (currentTheme === themeId) {
        console.log(`[delete-spicetify-theme] Theme "${themeId}" is currently active, resetting to default.`);
        await spicetifyCommand(spicetifyExec, ["config", "current_theme", ""]);
      }
    } catch (error) {
      console.warn(`[delete-spicetify-theme] Could not check/reset current theme:`, error);
    }

    const themeDir = path.join(themesDir, themeId);
    try {
      await fs.rm(themeDir, { recursive: true, force: true });
      console.log(`[delete-spicetify-theme] Deleted directory: ${themeDir}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error(`[delete-spicetify-theme] Failed to delete directory:`, error);
      }
    }

    return true;
  } catch (error) {
    console.error(`[delete-spicetify-theme] Failed to delete theme "${themeId}":`, error);
    return false;
  }
});
