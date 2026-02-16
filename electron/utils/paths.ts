import os from "node:os";
import path from "node:path";

export function getSpicetifyxDir(): string {
  return path.join(os.homedir(), ".spicetifyx");
}

export function getSpicetifyExec(): string {
  const dir = getSpicetifyxDir();
  return os.platform() === "win32"
    ? path.join(dir, "spicetify.exe")
    : path.join(dir, "spicetify");
}

export function getSpicetifyConfigDir(): string {
  return os.platform() === "win32"
    ? path.join(process.env.APPDATA!, "Spicetify")
    : path.join(os.homedir(), ".config", "spicetify");
}

export function getConfigFilePath(): string {
  return path.join(getSpicetifyConfigDir(), "config-xpui.ini");
}

export function getExtensionsDir(): string {
  return path.join(getSpicetifyConfigDir(), "Extensions");
}

export function getCustomAppsDir(): string {
  return path.join(getSpicetifyConfigDir(), "CustomApps");
}

export function getThemesDir(): string {
  return path.join(getSpicetifyConfigDir(), "Themes");
}
