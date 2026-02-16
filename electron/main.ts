import { app, BrowserWindow, ipcMain, protocol, Tray, Menu, nativeImage } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import DiscordRPC from "./utils/discord.ts";
import { handleThemeAsset } from "./protocol/theme-asset.ts";
import { handleAddonAsset } from "./protocol/addon-asset.ts";
import fs from "node:fs/promises";

createRequire(import.meta.url);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rpc = new DiscordRPC("1470628543938433034");
const rpcStart = Date.now();
let rpcConnected = false;

process.env.APP_ROOT = path.join(__dirname, "..");

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;

export let win: BrowserWindow | null;
export let tray: Tray | null = null;
let closeToTray = false;

function createWindow() {
  win = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
    },
    resizable: false,
    width: 916,
    height: 649,
    x: 200,
    y: 200,
    frame: false,
    title: "SpicetifyX Manager",
    icon: path.join(__dirname, "..", "build", "icon.png"),
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

app.on("window-all-closed", () => {
  if (!closeToTray && process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(async () => {
  console.log("ELECTRON MAIN PROCESS: Application is ready.");

  let appPath = app.getAppPath();
  const MAX_DEPTH = 10;
  let depth = 0;
  while (depth < MAX_DEPTH) {
    try {
      const entries = await fs.readdir(appPath);
      if (entries.includes("extensions") && entries.includes("themes")) {
        break;
      }
    } catch (e) {
      console.log(e);
    }
    const parent = path.join(appPath, "..");
    if (parent === appPath) break;
    appPath = parent;
    depth++;
  }

  process.env.APP_PATH = appPath;

  await import("./ipc/apply-spicetify-theme.ts");
  await import("./ipc/check-installation.ts");
  await import("./ipc/get-addon-asset-path.ts");
  await import("./ipc/get-spicetify-extensions.ts");
  await import("./ipc/get-spicetify-themes.ts");
  await import("./ipc/get-spicetify-version.ts");
  await import("./ipc/get-spotify-version.ts");
  await import("./ipc/install-spicetify.ts");
  await import("./ipc/restore-spicetify.ts");
  await import("./ipc/toggle-spicetify-extension.ts");
  await import("./ipc/window-close.ts");
  await import("./ipc/window-minimize.ts");
  await import("./ipc/get-theme-asset-path.ts");
  await import("./ipc/toggle-spicetify-app.ts");
  await import("./ipc/get-spicetify-apps.ts");
  await import("./ipc/settings.ts");
  await import("./ipc/install-marketplace-extension.ts");
  await import("./ipc/install-marketplace-theme.ts");
  await import("./ipc/install-marketplace-app.ts");
  await import("./ipc/delete-spicetify-extension.ts");
  await import("./ipc/delete-spicetify-app.ts");
  await import("./ipc/open-external-link.ts");
  await import("./ipc/delete-spicetify-theme.ts");
  await import("./ipc/install-spicetify-binary.ts");
  await import("./ipc/setup-spicetify-assets.ts");

  const { readSettings } = await import("./ipc/settings.ts");
  const appSettings = await readSettings();
  closeToTray = appSettings.closeToTray;

  try {
    if (appSettings.discordRpc) {
      await rpc.connect();
      rpcConnected = true;
      await rpc.setActivity({
        name: "SpicetifyX Manager",
        details: "Viewing Dashboard",
        created_at: rpcStart,
        type: 0,
      });
    }
  } catch (error) {
    console.error("Failed to connect to Discord RPC or set activity:", error);
  }

  const iconPath = path.join(__dirname, "..", "build", "icon.png");
  const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(trayIcon);
  tray.setToolTip("SpicetifyX Manager");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Show",
        click: () => {
          win?.show();
          win?.focus();
        },
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          closeToTray = false;
          app.quit();
        },
      },
    ]),
  );
  tray.on("double-click", () => {
    win?.show();
    win?.focus();
  });

  protocol.handle("addon-asset", handleAddonAsset);
  protocol.handle("theme-asset", handleThemeAsset);

  createWindow();
});

ipcMain.handle("set-rpc-activity", async (_, details: string) => {
  if (!rpcConnected) return;
  console.log(`Setting DiscordRPC activity: ${details}`);
  await rpc.setActivity({
    name: "SpicetifyX Manager",
    details,
    created_at: rpcStart,
    type: 0,
  });
});

ipcMain.handle("toggle-discord-rpc", async (_, enable: boolean) => {
  if (enable && !rpcConnected) {
    try {
      await rpc.connect();
      rpcConnected = true;
      await rpc.setActivity({
        name: "SpicetifyX Manager",
        details: "Viewing Dashboard",
        created_at: rpcStart,
        type: 0,
      });
    } catch (error) {
      console.error("Failed to connect to Discord RPC:", error);
    }
  } else if (!enable && rpcConnected) {
    rpc.close();
    rpcConnected = false;
  }
});

ipcMain.handle("set-close-to-tray", async (_, enable: boolean) => {
  closeToTray = enable;
});

ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});
