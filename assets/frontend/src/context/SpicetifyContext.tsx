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
  refreshExtensions: (syncBaseline?: boolean) => Promise<void>;
  refreshThemes: (syncBaseline?: boolean) => Promise<void>;
  refreshApps: (syncBaseline?: boolean) => Promise<void>;
  setExtensionsLocally: (extensions: AddonInfo[]) => void;
  setThemesLocally: (themes: ThemeInfo[]) => void;
  setAppsLocally: (apps: AppInfo[]) => void;
  commitChanges: () => Promise<void>;
  resetChanges: () => void;
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

  const refreshExtensions = async (syncBaseline = true) => {
    const data = await backend.GetInstalledExtensions();
    if (!syncBaseline) {
      const baselineIds = new Set(baselineExtensions.map((e) => e.addonFileName));
      data.forEach((ext) => {
        if (!baselineIds.has(ext.addonFileName)) {
          ext.isEnabled = true;
        }
      });
    }
    setExtensions(data);
    if (syncBaseline) setBaselineExtensions(data);
    setExtensionsLoaded(true);
    writeCache("sx_extensions", data);
  };

  const refreshThemes = async (syncBaseline = true) => {
    const data = await backend.GetSpicetifyThemes();
    // For themes, we usually want the newly installed one to become active
    if (!syncBaseline) {
      const baselineIds = new Set(baselineThemes.map((t) => t.id));
      const newTheme = data.find((t) => !baselineIds.has(t.id));
      if (newTheme) {
        data.forEach((t) => (t.isActive = t.id === newTheme.id));
      }
    }
    setThemes(data);
    if (syncBaseline) setBaselineThemes(data);
    setThemesLoaded(true);
    writeCache("sx_themes", data);
  };

  const refreshApps = async (syncBaseline = true) => {
    const data = await backend.GetSpicetifyApps();
    if (!syncBaseline) {
      const baselineIds = new Set(baselineApps.map((a) => a.id));
      data.forEach((app) => {
        if (!baselineIds.has(app.id)) {
          app.isEnabled = true;
        }
      });
    }
    setApps(data);
    if (syncBaseline) setBaselineApps(data);
    setAppsLoaded(true);
    writeCache("sx_apps", data);
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

    // 1. Extensions
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
       if (!themes.some(t => t.id === base.id) && !base.isBundled) {
         console.log(`[SpicetifyContext] Deleting theme ${base.id}`);
         await backend.DeleteSpicetifyTheme(base.id);
       }
    }

    console.log("[SpicetifyContext] Calling ReloadSpicetify (spicetify apply)");
    const success = await backend.ReloadSpicetify();
    console.log("[SpicetifyContext] ReloadSpicetify result:", success);

    // Refresh baselines after apply
    await Promise.all([refreshExtensions(), refreshThemes(), refreshApps()]);
    console.log("[SpicetifyContext] commitChanges END");
  };

  useEffect(() => {
    const fetchAll = (syncBaseline = false) => {
      const tasks: Promise<void>[] = [
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

  const resetChanges = () => {
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
