import { ipcRenderer, contextBridge } from "electron";

contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    on(...args: Parameters<typeof ipcRenderer.on>) {
      const [channel, listener] = args;
      return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args));
    },
    off(...args: Parameters<typeof ipcRenderer.off>) {
      const [channel, ...omit] = args;
      return ipcRenderer.off(channel, ...omit);
    },
    send(...args: Parameters<typeof ipcRenderer.send>) {
      const [channel, ...omit] = args;
      return ipcRenderer.send(channel, ...omit);
    },
    invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
      const [channel, ...omit] = args;
      return ipcRenderer.invoke(channel, ...omit);
    },
  },
  checkInstallation: () => ipcRenderer.invoke("check-installation"),
  getSpicetifyVersion: () => ipcRenderer.invoke("get-spicetify-version"),
  getSpotifyVersion: () => ipcRenderer.invoke("get-spotify-version"),
  getSpicetifyExtensions: () => ipcRenderer.invoke("get-spicetify-extensions"),
  toggleSpicetifyExtension: (addonId: string, enable: boolean) => ipcRenderer.invoke("toggle-spicetify-extension", addonId, enable),
  getAddonAssetPath: (relativePath: string) => ipcRenderer.invoke("get-addon-asset-path", relativePath),
  getThemeAssetPath: (relativePath: string) => ipcRenderer.invoke("get-theme-asset-path", relativePath),
  getSpicetifyThemes: () => ipcRenderer.invoke("get-spicetify-themes"),
  applySpicetifyTheme: (themeId: string) => ipcRenderer.invoke("apply-spicetify-theme", themeId),
  setRpcActivity: (details: string) => ipcRenderer.invoke("set-rpc-activity", details),
  toggleSpicetifyApp: (appId: string, enable: boolean) => ipcRenderer.invoke("toggle-spicetify-app", appId, enable),
  getSpicetifyApps: () => ipcRenderer.invoke("get-spicetify-apps"),
  getSettings: () => ipcRenderer.invoke("get-settings"),
  updateSettings: (settings: Record<string, any>) => ipcRenderer.invoke("update-settings", settings),
  installMarketplaceExtension: (extensionUrl: string, filename: string, meta?: Record<string, any>) =>
    ipcRenderer.invoke("install-marketplace-extension", extensionUrl, filename, meta),
  installMarketplaceTheme: (themeId: string, cssURL: string, schemesURL?: string, include?: string[], meta?: Record<string, any>) =>
    ipcRenderer.invoke("install-marketplace-theme", themeId, cssURL, schemesURL, include, meta),
  installMarketplaceApp: (user: string, repo: string, appName: string, branch?: string, meta?: Record<string, any>) =>
    ipcRenderer.invoke("install-marketplace-app", user, repo, appName, branch, meta),
  deleteSpicetifyExtension: (addonFileName: string) => ipcRenderer.invoke("delete-spicetify-extension", addonFileName),
  deleteSpicetifyApp: (appId: string) => ipcRenderer.invoke("delete-spicetify-app", appId),
  deleteSpicetifyTheme: (themeId: string) => ipcRenderer.invoke("delete-spicetify-theme", themeId),
  openConfigFolder: () => ipcRenderer.invoke("open-config-folder"),
  openExternalLink: (url: string) => ipcRenderer.invoke("open-external-link", url),
  toggleDiscordRpc: (enable: boolean) => ipcRenderer.invoke("toggle-discord-rpc", enable),
  setCloseToTray: (enable: boolean) => ipcRenderer.invoke("set-close-to-tray", enable),
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  minimizeWindow: () => ipcRenderer.invoke("window-minimize"),
  closeWindow: () => ipcRenderer.invoke("window-close"),
  startInstall: () => ipcRenderer.send("start-install"),
  startRestore: () => ipcRenderer.send("start-restore"),
  onInstallComplete: (cb: (event: Electron.IpcRendererEvent, result: { success: boolean; error?: string }) => void) => {
    ipcRenderer.on("install-complete", cb);
    return () => {
      ipcRenderer.off("install-complete", cb);
    };
  },
  onRestoreComplete: (cb: (event: Electron.IpcRendererEvent, result: { success: boolean; error?: string }) => void) => {
    ipcRenderer.on("restore-complete", cb);
    return () => {
      ipcRenderer.off("restore-complete", cb);
    };
  },
  onCommandOutput: (cb: (event: Electron.IpcRendererEvent, data: string) => void) => {
    ipcRenderer.on("spicetify-command-output", cb);
    return () => {
      ipcRenderer.off("spicetify-command-output", cb);
    };
  },
  installSpicetifyBinary: () => ipcRenderer.invoke("install-spicetify-binary"),
  setupSpicetifyAssets: () => ipcRenderer.invoke("setup-spicetify-assets"),
});
