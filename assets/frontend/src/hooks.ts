import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { } from "@redux-devtools/extension";
import { app } from "../wailsjs/go/models";

type AppState = {
  spotifyVersion?: string;
  spicetifyVersion?: string;
  extensions: app.AddonInfo[];
  themes: app.ThemeInfo[];
  apps: app.AppInfo[];
  setExtensions: (extensions: app.AddonInfo[]) => void;
  setThemes: (themes: app.ThemeInfo[]) => void;
  setApps: (apps: app.AppInfo[]) => void;
  setSpotifyVersion: (version: string) => void;
  setSpicetifyVersion: (version: string) => void;
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        spotifyVersion: undefined,
        spicetifyVersion: undefined,
        extensions: [],
        themes: [],
        apps: [],

        setExtensions: (extensions) => set(() => ({ extensions: extensions })),
        setThemes: (themes) => set(() => ({ themes: themes })),
        setApps: (apps) => set(() => ({ apps: apps })),
        setSpotifyVersion: (version) => set(() => ({ spotifyVersion: version })),
        setSpicetifyVersion: (version) => set(() => ({ spicetifyVersion: version })),
      }),
      {
        name: "bear-storage",
      },
    ),
  ),
);
