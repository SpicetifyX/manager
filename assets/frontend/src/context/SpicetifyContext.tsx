import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import * as backend from "../../wailsjs/go/app/App";
import { AddonInfo } from "../types/addon.d";
import { ThemeInfo } from "../types/theme.d";
import { AppInfo } from "../types/app.d";

const CACHE_TTL_MS = 5 * 60_000; // 5 minutes

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: T; ts: number };
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch { }
}

interface SpicetifyContextValue {
  extensions: AddonInfo[];
  themes: ThemeInfo[];
  apps: AppInfo[];
  baselineExtensions: AddonInfo[];
  baselineThemes: ThemeInfo[];
  baselineApps: AppInfo[];
  spotifyVersion: string | null;
  spicetifyVersion: string | null;
  extensionsLoaded: boolean;
  themesLoaded: boolean;
  appsLoaded: boolean;
  refreshExtensions: (syncBaseline?: boolean) => Promise<AddonInfo[]>;
  refreshThemes: (syncBaseline?: boolean) => Promise<ThemeInfo[]>;
  refreshApps: (syncBaseline?: boolean) => Promise<AppInfo[]>;
  setExtensionsLocally: (extensions: AddonInfo[]) => void;
  setThemesLocally: (themes: ThemeInfo[]) => void;
  setAppsLocally: (apps: AppInfo[]) => void;
  commitChanges: () => Promise<void>;
  resetChanges: () => Promise<void>;
}

const SpicetifyContext = createContext<SpicetifyContextValue | null>(null);

export function SpicetifyProvider({ children }: { children: ReactNode }) {
  const [extensions, setExtensions] = useState<AddonInfo[]>(() => readCache<AddonInfo[]>("sx_extensions") ?? []);
  const [themes, setThemes] = useState<ThemeInfo[]>(() => readCache<ThemeInfo[]>("sx_themes") ?? []);
  const [apps, setApps] = useState<AppInfo[]>(() => readCache<AppInfo[]>("sx_apps") ?? []);

  const [baselineExtensions, setBaselineExtensions] = useState<AddonInfo[]>(extensions);
  const [baselineThemes, setBaselineThemes] = useState<ThemeInfo[]>(themes);
  const [baselineApps, setBaselineApps] = useState<AppInfo[]>(apps);

  const [spotifyVersion, setSpotifyVersion] = useState<string | null>(() => readCache<string>("sx_spotify_ver"));
  const [spicetifyVersion, setSpicetifyVersion] = useState<string | null>(() => readCache<string>("sx_spicetify_ver"));
  const [extensionsLoaded, setExtensionsLoaded] = useState(() => readCache("sx_extensions") !== null);
  const [themesLoaded, setThemesLoaded] = useState(() => readCache("sx_themes") !== null);
  const [appsLoaded, setAppsLoaded] = useState(() => readCache("sx_apps") !== null);

  const refreshExtensions = async (syncBaseline = true): Promise<AddonInfo[]> => {
    const raw = await backend.GetInstalledExtensions();
    if (!syncBaseline) {
      const baselineIds = new Set(baselineExtensions.map((e) => e.addonFileName));
      const localIds = new Set(extensions.map((e) => e.addonFileName));
      const localStateMap = new Map(extensions.map((e) => [e.addonFileName, e.isEnabled]));
      const merged = raw.filter((ext) => {
        if (baselineIds.has(ext.addonFileName) && !localIds.has(ext.addonFileName)) return false;
        return true;
      });
      merged.forEach((ext) => {
        if (localStateMap.has(ext.addonFileName)) {
          ext.isEnabled = localStateMap.get(ext.addonFileName)!;
        } else if (!baselineIds.has(ext.addonFileName)) {
          ext.isEnabled = true;
        }
      });
      setExtensions(merged);
      setExtensionsLoaded(true);
      writeCache("sx_extensions", merged);
      return merged;
    }
    setExtensions(raw);
    setBaselineExtensions(raw);
    setExtensionsLoaded(true);
    writeCache("sx_extensions", raw);
    return raw;
  };

  const refreshThemes = async (syncBaseline = true): Promise<ThemeInfo[]> => {
    const raw = await backend.GetSpicetifyThemes();
    if (!syncBaseline) {
      const baselineIds = new Set(baselineThemes.map((t) => t.id));
      const localIds = new Set(themes.map((t) => t.id));
      const merged = raw.filter((t) => {
        if (baselineIds.has(t.id) && !localIds.has(t.id)) return false;
        return true;
      });
      const brandNewTheme = merged.find((t) => !baselineIds.has(t.id) && !localIds.has(t.id));
      if (brandNewTheme) {
        merged.forEach((t) => (t.isActive = t.id === brandNewTheme.id));
      } else {
        const localActiveTheme = themes.find((t) => t.isActive);
        merged.forEach((t) => {
          const localT = themes.find((lt) => lt.id === t.id);
          t.isActive = localActiveTheme ? t.id === localActiveTheme.id : t.isActive;
          if (localT?.activeColorScheme) t.activeColorScheme = localT.activeColorScheme;
        });
      }
      setThemes(merged);
      setThemesLoaded(true);
      writeCache("sx_themes", merged);
      return merged;
    }
    setThemes(raw);
    setBaselineThemes(raw);
    setThemesLoaded(true);
    writeCache("sx_themes", raw);
    return raw;
  };

  const refreshApps = async (syncBaseline = true): Promise<AppInfo[]> => {
    const raw = await backend.GetSpicetifyApps();
    if (!syncBaseline) {
      const baselineIds = new Set(baselineApps.map((a) => a.id));
      const localIds = new Set(apps.map((a) => a.id));
      const localStateMap = new Map(apps.map((a) => [a.id, a.isEnabled]));
      const merged = raw.filter((app) => {
        if (baselineIds.has(app.id) && !localIds.has(app.id)) return false;
        return true;
      });
      merged.forEach((app) => {
        if (localStateMap.has(app.id)) {
          app.isEnabled = localStateMap.get(app.id)!;
        } else if (!baselineIds.has(app.id)) {
          app.isEnabled = true;
        }
      });
      setApps(merged);
      setAppsLoaded(true);
      writeCache("sx_apps", merged);
      return merged;
    }
    setApps(raw);
    setBaselineApps(raw);
    setAppsLoaded(true);
    writeCache("sx_apps", raw);
    return raw;
  };

  const setExtensionsLocally = (data: AddonInfo[]) => {
    setExtensions(data);
  };

  const setThemesLocally = (data: ThemeInfo[]) => {
    setThemes(data);
  };

  const setAppsLocally = (data: AppInfo[]) => {
    setApps(data);
  };

  const commitChanges = async () => {
    console.log("[SpicetifyContext] commitChanges START");
    try {
      // 1. Extensions — toggle or delete anything that changed vs baseline
      for (const ext of extensions) {
        const baseline = baselineExtensions.find((b) => b.addonFileName === ext.addonFileName);
        if (!baseline || baseline.isEnabled !== ext.isEnabled) {
          console.log(`[SpicetifyContext] Toggling extension ${ext.addonFileName} to ${ext.isEnabled}`);
          await backend.ToggleSpicetifyExtension(ext.addonFileName, ext.isEnabled);
        }
      }
      for (const base of baselineExtensions) {
        if (!extensions.some((ext) => ext.addonFileName === base.addonFileName)) {
          console.log(`[SpicetifyContext] Deleting extension ${base.addonFileName}`);
          await backend.DeleteSpicetifyExtension(base.addonFileName);
        }
      }

      // 2. Apps
      for (const app of apps) {
        const baseline = baselineApps.find((b) => b.id === app.id);
        if (!baseline || baseline.isEnabled !== app.isEnabled) {
          console.log(`[SpicetifyContext] Toggling app ${app.id} to ${app.isEnabled}`);
          await backend.ToggleSpicetifyApp(app.id, app.isEnabled);
        }
      }
      for (const base of baselineApps) {
        if (!apps.some((app) => app.id === base.id)) {
          console.log(`[SpicetifyContext] Deleting app ${base.id}`);
          await backend.DeleteSpicetifyApp(base.id);
        }
      }

      // 3. Themes
      const activeTheme = themes.find((t) => t.isActive);
      const baselineActiveTheme = baselineThemes.find((t) => t.isActive);
      if (activeTheme) {
        if (!baselineActiveTheme || activeTheme.id !== baselineActiveTheme.id) {
          console.log(`[SpicetifyContext] Applying theme ${activeTheme.id}`);
          await backend.ApplySpicetifyTheme(activeTheme.id);
        } else if (activeTheme.activeColorScheme && activeTheme.activeColorScheme !== baselineActiveTheme.activeColorScheme) {
          console.log(`[SpicetifyContext] Setting color scheme ${activeTheme.activeColorScheme}`);
          await backend.SetColorScheme(activeTheme.id, activeTheme.activeColorScheme);
        }
      }
      for (const base of baselineThemes) {
        if (!themes.some((t) => t.id === base.id) && !base.isBundled) {
          console.log(`[SpicetifyContext] Deleting theme ${base.id}`);
          await backend.DeleteSpicetifyTheme(base.id);
        }
      }

      // 4. Run spicetify apply to restart Spotify with changes
      console.log("[SpicetifyContext] Calling ReloadSpicetify (spicetify apply)");
      const success = await backend.ReloadSpicetify();
      console.log("[SpicetifyContext] ReloadSpicetify result:", success);
      if (!success) {
        throw new Error("spicetify apply failed — check that Spotify is installed and Spicetify is configured correctly.");
      }

      // 5. Sync baselines to current state so dirty flags clear
      await Promise.all([refreshExtensions(true), refreshThemes(true), refreshApps(true)]);
      console.log("[SpicetifyContext] commitChanges END");
    } catch (err: any) {
      console.error("[SpicetifyContext] commitChanges ERROR:", err);
      // Re-throw so the caller (PendingChangesBar) can show the error state
      throw err instanceof Error ? err : new Error(String(err));
    }
  };

  useEffect(() => {
    const fetchAll = (syncBaseline = false) => {
      const tasks: Promise<unknown>[] = [
        refreshExtensions(syncBaseline),
        refreshThemes(syncBaseline),
        refreshApps(syncBaseline),
        backend
          .GetSpotifyVersion()
          .then((v) => {
            setSpotifyVersion(v);
            writeCache("sx_spotify_ver", v);
          })
          .catch(() => setSpotifyVersion("Unknown")),
        backend
          .GetSpicetifyVersion()
          .then((v) => {
            setSpicetifyVersion(v);
            writeCache("sx_spicetify_ver", v);
          })
          .catch(() => { }),
      ];
      Promise.all(tasks).catch((err) => console.error("[SpicetifyContext] Background fetch error:", err));
    };

    // Initial load: sync baseline
    fetchAll(true);
    
    // Background polling: do NOT sync baseline
    const interval = setInterval(() => fetchAll(false), CACHE_TTL_MS);
    return () => clearInterval(interval);
  }, []);

  const resetChanges = async () => {
    // Delete files that were installed since baseline but not yet applied
    for (const ext of extensions) {
      if (!baselineExtensions.some((b) => b.addonFileName === ext.addonFileName)) {
        await backend.DeleteSpicetifyExtension(ext.addonFileName);
      }
    }
    for (const theme of themes) {
      if (!baselineThemes.some((b) => b.id === theme.id) && !theme.isBundled) {
        await backend.DeleteSpicetifyTheme(theme.id);
      }
    }
    for (const app of apps) {
      if (!baselineApps.some((b) => b.id === app.id)) {
        await backend.DeleteSpicetifyApp(app.id);
      }
    }
    setExtensions(baselineExtensions);
    setThemes(baselineThemes);
    setApps(baselineApps);
  };

  return (
    <SpicetifyContext.Provider
      value={{
        extensions,
        themes,
        apps,
        baselineExtensions,
        baselineThemes,
        baselineApps,
        spotifyVersion,
        spicetifyVersion,
        extensionsLoaded,
        themesLoaded,
        appsLoaded,
        refreshExtensions,
        refreshThemes,
        refreshApps,
        setExtensionsLocally,
        setThemesLocally,
        setAppsLocally,
        commitChanges,
        resetChanges,
      }}
    >
      {children}
    </SpicetifyContext.Provider>
  );
}

export function useSpicetify() {
  const ctx = useContext(SpicetifyContext);
  if (!ctx) throw new Error("useSpicetify must be used within SpicetifyProvider");
  return ctx;
}
