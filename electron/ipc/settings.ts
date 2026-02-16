import { ipcMain, shell } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import { getSpicetifyxDir, getSpicetifyConfigDir } from "../utils/paths";

export type AppSettings = {
  discordRpc: boolean;
  closeToTray: boolean;
  checkUpdatesOnLaunch: boolean;
};

const DEFAULT_SETTINGS: AppSettings = {
  discordRpc: true,
  closeToTray: false,
  checkUpdatesOnLaunch: true,
};

export function getSettingsPath(): string {
  return path.join(getSpicetifyxDir(), "settings.json");
}

export async function readSettings(): Promise<AppSettings> {
  try {
    const raw = await fs.readFile(getSettingsPath(), "utf-8");
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function writeSettings(settings: AppSettings): Promise<void> {
  const dir = path.dirname(getSettingsPath());
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(getSettingsPath(), JSON.stringify(settings, null, 2), "utf-8");
}

ipcMain.handle("get-settings", async (): Promise<AppSettings> => {
  return readSettings();
});

ipcMain.handle("update-settings", async (_, settings: Partial<AppSettings>): Promise<AppSettings> => {
  const current = await readSettings();
  const updated = { ...current, ...settings };
  await writeSettings(updated);
  return updated;
});

ipcMain.handle("open-config-folder", async (): Promise<boolean> => {
  try {
    const configDir = getSpicetifyConfigDir();
    await shell.openPath(configDir);
    return true;
  } catch (error) {
    console.error("Failed to open config folder:", error);
    return false;
  }
});
