import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import * as backend from "../../wailsjs/go/app/App";
import { AddonInfo } from "../types/addon.d";
import { ThemeInfo } from "../types/theme.d";
import { AppInfo } from "../types/app.d";

const CACHE_TTL_MS = 5 * 60_000; // 5 minutes — avoids spawning spicetify -v too often

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
  spotifyVersion: string | null;
  spicetifyVersion: string | null;
  extensionsLoaded: boolean;
  themesLoaded: boolean;
  appsLoaded: boolean;
  refreshExtensions: () => Promise<void>;
  refreshThemes: () => Promise<void>;
  refreshApps: () => Promise<void>;
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

  const refreshExtensions = async () => {
    const data = await backend.GetInstalledExtensions();
    setExtensions(data);
    setBaselineExtensions(data);
    setExtensionsLoaded(true);
    writeCache("sx_extensions", data);
  };

  const refreshThemes = async () => {
    const data = await backend.GetSpicetifyThemes();
    setThemes(data);
    setBaselineThemes(data);
    setThemesLoaded(true);
    writeCache("sx_themes", data);
  };

  const refreshApps = async () => {
    const data = await backend.GetSpicetifyApps();
    setApps(data);
    setBaselineApps(data);
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
    // 1. Extensions
    for (const ext of extensions) {
      const baseline = baselineExtensions.find((b) => b.addonFileName === ext.addonFileName);
      if (baseline && baseline.isEnabled !== ext.isEnabled) {
        await backend.ToggleSpicetifyExtension(ext.addonFileName, ext.isEnabled);
      }
    }

    // 2. Apps
    for (const app of apps) {
      const baseline = baselineApps.find((b) => b.id === app.id);
      if (baseline && baseline.isEnabled !== app.isEnabled) {
        await backend.ToggleSpicetifyApp(app.id, app.isEnabled);
      }
    }

    // 3. Themes
    const activeTheme = themes.find((t) => t.isActive);
    const baselineActiveTheme = baselineThemes.find((t) => t.isActive);
    if (activeTheme && activeTheme.id !== baselineActiveTheme?.id) {
      await backend.ApplySpicetifyTheme(activeTheme.id);
    } else if (activeTheme && activeTheme.activeColorScheme !== baselineActiveTheme?.activeColorScheme) {
      await backend.SetColorScheme(activeTheme.id, activeTheme.activeColorScheme);
    }

    await backend.ReloadSpicetify();

    // Refresh baselines after apply
    await Promise.all([refreshExtensions(), refreshThemes(), refreshApps()]);
  };

  useEffect(() => {
    const fetchAll = () => {
      const tasks: Promise<void>[] = [
        refreshExtensions(),
        refreshThemes(),
        refreshApps(),
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

    fetchAll();
    const interval = setInterval(fetchAll, CACHE_TTL_MS);
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
