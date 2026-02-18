/**
 * Wails bridge — exposes the same interface as window.electron did in Electron,
 * but calls Wails Go bindings and runtime instead.
 *
 * Usage: import { bridge } from './lib/bridge'  (or access window.electron shim below)
 */

import {
  CheckInstallation,
  GetSpicetifyVersion,
  GetSpotifyVersion,
  GetSpicetifyExtensions,
  ToggleSpicetifyExtension,
  GetAddonAssetPath,
  GetThemeAssetPath,
  GetSpicetifyThemes,
  ApplySpicetifyTheme,
  SetColorScheme,
  SetRpcActivity,
  ToggleSpicetifyApp,
  GetSpicetifyApps,
  GetSettings,
  UpdateSettings,
  InstallMarketplaceExtension,
  InstallMarketplaceTheme,
  InstallMarketplaceApp,
  DeleteSpicetifyExtension,
  DeleteSpicetifyApp,
  DeleteSpicetifyTheme,
  OpenConfigFolder,
  OpenExternalLink,
  ToggleDiscordRpc,
  SetCloseToTray,
  GetAppVersion,
  WindowMinimize,
  WindowClose,
  StartInstall,
  StartRestore,
  InstallSpicetifyBinary,
  SetupSpicetifyAssets,
  ReloadSpicetify,
} from '../../wailsjs/go/main/App'

import { EventsOn, EventsOff, WindowMinimise } from '../../wailsjs/runtime/runtime'

export const bridge = {
  checkInstallation: CheckInstallation,
  getSpicetifyVersion: GetSpicetifyVersion,
  getSpotifyVersion: GetSpotifyVersion,
  getSpicetifyExtensions: GetSpicetifyExtensions,
  toggleSpicetifyExtension: ToggleSpicetifyExtension,
  getAddonAssetPath: GetAddonAssetPath,
  getThemeAssetPath: GetThemeAssetPath,
  getSpicetifyThemes: GetSpicetifyThemes,
  applySpicetifyTheme: ApplySpicetifyTheme,
  setColorScheme: SetColorScheme,
  setRpcActivity: SetRpcActivity,
  toggleSpicetifyApp: ToggleSpicetifyApp,
  getSpicetifyApps: GetSpicetifyApps,
  getSettings: GetSettings,
  updateSettings: UpdateSettings,
  installMarketplaceExtension: InstallMarketplaceExtension,
  installMarketplaceTheme: InstallMarketplaceTheme,
  installMarketplaceApp: InstallMarketplaceApp,
  deleteSpicetifyExtension: DeleteSpicetifyExtension,
  deleteSpicetifyApp: DeleteSpicetifyApp,
  deleteSpicetifyTheme: DeleteSpicetifyTheme,
  openConfigFolder: OpenConfigFolder,
  openExternalLink: OpenExternalLink,
  toggleDiscordRpc: ToggleDiscordRpc,
  setCloseToTray: SetCloseToTray,
  getAppVersion: GetAppVersion,
  minimizeWindow: () => WindowMinimise(),
  closeWindow: WindowClose,
  startInstall: StartInstall,
  startRestore: StartRestore,
  installSpicetifyBinary: InstallSpicetifyBinary,
  setupSpicetifyAssets: SetupSpicetifyAssets,
  reloadSpicetify: ReloadSpicetify,

  onInstallComplete: (cb: (event: any, result: { success: boolean; error?: string }) => void) => {
    EventsOn('install-complete', (result: { success: boolean; error?: string }) => cb(null, result))
    return () => EventsOff('install-complete')
  },

  onRestoreComplete: (cb: (event: any, result: { success: boolean; error?: string }) => void) => {
    EventsOn('restore-complete', (result: { success: boolean; error?: string }) => cb(null, result))
    return () => EventsOff('restore-complete')
  },

  onCommandOutput: (cb: (event: any, data: string) => void) => {
    EventsOn('spicetify-command-output', (data: string) => cb(null, data))
    return () => EventsOff('spicetify-command-output')
  },
}

// Shim window.electron so all existing components work without any changes
declare global {
  interface Window {
    electron: typeof bridge
  }
}

window.electron = bridge
