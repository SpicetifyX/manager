import type { AddonInfo } from "./addon";
import type { AppInfo } from "./app";
import type { ThemeInfo } from "./theme";

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        on: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => Electron.IpcRenderer;
        off: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => Electron.IpcRenderer;
        send: (channel: string, ...args: any[]) => void;
        invoke: <T>(channel: string, ...args: any[]) => Promise<T>;
      };
      checkInstallation: () => Promise<{
        spotify_installed: boolean;
        spicetify_installed: boolean;
        already_patched: boolean;
      }>;
      getSpicetifyVersion: () => Promise<string>;
      getSpotifyVersion: () => Promise<string>;
      getSpicetifyExtensions: () => Promise<AddonInfo[]>;
      toggleSpicetifyExtension: (addonFileName: string, enable: boolean) => Promise<boolean>;
      getAddonAssetPath: (relativePath: string) => Promise<string>;
      getThemeAssetPath: (relativePath: string) => Promise<string>;
      getSpicetifyThemes: () => Promise<ThemeInfo[]>;
      applySpicetifyTheme: (themeId: string) => Promise<boolean>;
      setRpcActivity: (details: string) => Promise<void>;
      toggleSpicetifyApp: (appId: string, enable: boolean) => Promise<boolean>;
      getSpicetifyApps: () => Promise<AppInfo[]>;
      getSettings: () => Promise<Record<string, any>>;
      updateSettings: (settings: Record<string, any>) => Promise<Record<string, any>>;
      installMarketplaceExtension: (extensionUrl: string, filename: string, meta?: Record<string, any>) => Promise<boolean>;
      installMarketplaceTheme: (
        themeId: string,
        cssURL: string,
        schemesURL?: string,
        include?: string[],
        meta?: Record<string, any>,
      ) => Promise<boolean>;
      installMarketplaceApp: (
        user: string,
        repo: string,
        appName: string,
        branch?: string,
        meta?: Record<string, any>,
      ) => Promise<boolean>;
      deleteSpicetifyExtension: (addonFileName: string) => Promise<boolean>;
      deleteSpicetifyApp: (appId: string) => Promise<boolean>;
      deleteSpicetifyTheme: (themeId: string) => Promise<boolean>;
      openConfigFolder: () => Promise<boolean>;
      openExternalLink: (url: string) => Promise<boolean>;
      toggleDiscordRpc: (enable: boolean) => Promise<void>;
      setCloseToTray: (enable: boolean) => Promise<void>;
      getAppVersion: () => Promise<string>;
      minimizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      startInstall: () => Promise<void>;
      startRestore: () => Promise<void>;
      onInstallComplete: (cb: (event: Electron.IpcRendererEvent, result: { success: boolean; error?: string }) => void) => () => void;
      onRestoreComplete: (cb: (event: Electron.IpcRendererEvent, result: { success: boolean; error?: string }) => void) => () => void;
      onCommandOutput: (cb: (event: Electron.IpcRendererEvent, data: string) => void) => () => void;
      installSpicetifyBinary: () => Promise<void>;
      setupSpicetifyAssets: () => Promise<void>;
    };
  }
}
