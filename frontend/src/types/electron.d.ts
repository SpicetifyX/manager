// Type declarations for the Wails bridge shim.
// The actual runtime object is set by src/lib/bridge.ts which maps
// all window.electron.* calls to Wails Go bindings.
import type { AddonInfo } from './addon'
import type { AppInfo } from './app'
import type { ThemeInfo } from './theme'

declare global {
  interface Window {
    electron: {
      checkInstallation: () => Promise<{
        spotify_installed: boolean
        spicetify_installed: boolean
        already_patched: boolean
      }>
      getSpicetifyVersion: () => Promise<string>
      getSpotifyVersion: () => Promise<string>
      getSpicetifyExtensions: () => Promise<AddonInfo[]>
      toggleSpicetifyExtension: (addonFileName: string, enable: boolean) => Promise<boolean>
      getAddonAssetPath: (relativePath: string) => Promise<string>
      getThemeAssetPath: (relativePath: string) => Promise<string>
      getSpicetifyThemes: () => Promise<ThemeInfo[]>
      applySpicetifyTheme: (themeId: string) => Promise<boolean>
      setColorScheme: (themeId: string, scheme: string) => Promise<boolean>
      setRpcActivity: (details: string) => Promise<void>
      toggleSpicetifyApp: (appId: string, enable: boolean) => Promise<boolean>
      getSpicetifyApps: () => Promise<AppInfo[]>
      getSettings: () => Promise<Record<string, any>>
      updateSettings: (settings: Record<string, any>) => Promise<Record<string, any>>
      installMarketplaceExtension: (extensionUrl: string, filename: string, meta?: Record<string, any>) => Promise<boolean>
      installMarketplaceTheme: (
        themeId: string,
        cssURL: string,
        schemesURL?: string,
        include?: string[],
        meta?: Record<string, any>
      ) => Promise<boolean>
      installMarketplaceApp: (
        user: string,
        repo: string,
        appName: string,
        branch?: string,
        meta?: Record<string, any>
      ) => Promise<boolean>
      deleteSpicetifyExtension: (addonFileName: string) => Promise<boolean>
      deleteSpicetifyApp: (appId: string) => Promise<boolean>
      deleteSpicetifyTheme: (themeId: string) => Promise<boolean>
      openConfigFolder: () => Promise<boolean>
      openExternalLink: (url: string) => Promise<boolean>
      toggleDiscordRpc: (enable: boolean) => Promise<void>
      setCloseToTray: (enable: boolean) => Promise<void>
      getAppVersion: () => Promise<string>
      minimizeWindow: () => Promise<void>
      closeWindow: () => Promise<void>
      startInstall: () => Promise<void>
      startRestore: () => Promise<void>
      onInstallComplete: (cb: (event: any, result: { success: boolean; error?: string }) => void) => () => void
      onRestoreComplete: (cb: (event: any, result: { success: boolean; error?: string }) => void) => () => void
      onCommandOutput: (cb: (event: any, data: string) => void) => () => void
      installSpicetifyBinary: () => Promise<void>
      setupSpicetifyAssets: () => Promise<void>
      reloadSpicetify: () => Promise<boolean>
    }
  }
}
