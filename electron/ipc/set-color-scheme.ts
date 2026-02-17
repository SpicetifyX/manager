import { ipcMain } from "electron";
import { spicetifyCommand } from "../utils/spicetifyCommand";
import { getSpicetifyExec } from "../utils/paths";

ipcMain.handle("set-color-scheme", async (_, themeId: string, scheme: string): Promise<boolean> => {
  try {
    console.log(`[set-color-scheme] Setting color scheme "${scheme}" for theme "${themeId}"`);

    const spicetifyExec = getSpicetifyExec();

    await spicetifyCommand(spicetifyExec, ["config", "color_scheme", scheme]);
    await spicetifyCommand(spicetifyExec, ["apply"]);

    console.log(`[set-color-scheme] Color scheme "${scheme}" applied successfully.`);
    return true;
  } catch (error) {
    console.error(`[set-color-scheme] Failed to set color scheme:`, error);
    return false;
  }
});
