import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import * as backend from "../../wailsjs/go/app/App";
import { AddonInfo } from "../types/addon.d";
import { ThemeInfo } from "../types/theme.d";
import { AppInfo } from "../types/app.d";

const CACHE_TTL_MS = 60_000;

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
}

const SpicetifyContext = createContext<SpicetifyContextValue | null>(null);

export function SpicetifyProvider({ children }: { children: ReactNode }) {
  const [extensions, setExtensions] = useState<AddonInfo[]>(() => readCache<AddonInfo[]>("sx_extensions") ?? []);
  const [themes, setThemes] = useState<ThemeInfo[]>(() => readCache<ThemeInfo[]>("sx_themes") ?? []);
  const [apps, setApps] = useState<AppInfo[]>(() => readCache<AppInfo[]>("sx_apps") ?? []);
  const [spotifyVersion, setSpotifyVersion] = useState<string | null>(() => readCache<string>("sx_spotify_ver"));
  const [spicetifyVersion, setSpicetifyVersion] = useState<string | null>(() => readCache<string>("sx_spicetify_ver"));
  const [extensionsLoaded, setExtensionsLoaded] = useState(() => readCache("sx_extensions") !== null);
  const [themesLoaded, setThemesLoaded] = useState(() => readCache("sx_themes") !== null);
  const [appsLoaded, setAppsLoaded] = useState(() => readCache("sx_apps") !== null);

  const refreshExtensions = async () => {
    const data = await backend.GetInstalledExtensions();
    setExtensions(data);
    setExtensionsLoaded(true);
    writeCache("sx_extensions", data);
  };

  const refreshThemes = async () => {
    const data = await backend.GetSpicetifyThemes();
    setThemes(data);
    setThemesLoaded(true);
    writeCache("sx_themes", data);
  };

  const refreshApps = async () => {
    const data = await backend.GetSpicetifyApps();
    setApps(data);
    setAppsLoaded(true);
    writeCache("sx_apps", data);
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
