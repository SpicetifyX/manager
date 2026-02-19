import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { FaAppStore, FaCheckCircle, FaChevronRight, FaExclamationTriangle, FaPalette, FaPuzzlePiece, FaSync } from "react-icons/fa";
import * as backend from "../../wailsjs/go/app/App";
import { Link } from "react-router-dom";
import { useAppStore } from "../hooks";

export default function DashboardPage() {
  const appState = useAppStore();
  const [status, setStatus] = useState<{
    spotify: boolean;
    spicetify: boolean;
    patched: boolean;
  } | null>(null);
  const [info, setInfo] = useState<{
    spotifyVersion: string;
    spicetifyVersion: string;
    extensionsCount: number;
    enabledExtensions: number;
    themesCount: number;
    appsCount: number;
    enabledApps: number;
  } | null>({
    appsCount: appState.apps.length,
    enabledApps: appState.apps.filter((app) => app.isEnabled).length,
    enabledExtensions: appState.extensions.filter((ext) => ext.isEnabled).length,
    extensionsCount: appState.extensions.length,
    themesCount: appState.themes.length,
    spicetifyVersion: appState.spicetifyVersion || "",
    spotifyVersion: appState.spotifyVersion || "",
  });

  useEffect(() => {
    (async () => {
      const status = await backend.CheckInstallation();
      setStatus(status);

      const apps = await backend.GetSpicetifyApps();
      const themes = await backend.GetSpicetifyThemes();
      const extensions = await backend.GetInstalledExtensions();
      const spotifyVersion = await backend.GetSpotifyVersion();
      const spicetifyVersion = await backend.GetSpicetifyVersion();

      appState.setSpicetifyVersion(spicetifyVersion);
      appState.setApps(apps);
      appState.setThemes(themes);
      appState.setExtensions(extensions);
      appState.setSpicetifyVersion(spicetifyVersion);
      appState.setSpotifyVersion(spotifyVersion);

      setInfo({
        appsCount: appState.apps.length,
        enabledApps: appState.apps.filter((app) => app.isEnabled).length,
        enabledExtensions: appState.extensions.filter((ext) => ext.isEnabled).length,
        extensionsCount: appState.extensions.length,
        themesCount: appState.themes.length,
        spicetifyVersion: appState.spicetifyVersion || "",
        spotifyVersion: appState.spotifyVersion || "",
      });
    })();
  }, []);

  return (
    <div className="flex h-full w-full flex-1">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="flex h-full flex-1 flex-col overflow-x-hidden overflow-y-auto bg-[#171b20] p-5">
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="mt-1 text-sm text-[#a0a0a0]">Overview of your Spicetify installation</p>
          </div>

          {!status ? (
            <div className="flex w-full flex-1 items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#2a2a2a] border-t-[#d63c6a]"></div>
                <p className="text-sm text-[#a0a0a0]">Loading dashboard...</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col space-y-4">
              <div className="overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#121418] px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {status.patched ? (
                      <>
                        <FaCheckCircle className="h-7 w-7 text-[#d63c6a]" />
                        <div>
                          <h2 className="text-xl font-bold text-white">Everything's Running</h2>
                          <p className="text-sm text-[#a0a0a0]">Spicetify is active and patched</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <FaExclamationTriangle className="h-7 w-7 text-yellow-500" />
                        <div>
                          <h2 className="text-xl font-bold text-white">Setup Required</h2>
                          <p className="text-sm text-[#a0a0a0]">Spicetify needs to be installed</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Link
                  to={"/extensions"}
                  className="group relative flex flex-col overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#121418] p-2 text-left transition-all hover:border-[#d63c6a] hover:shadow-lg hover:shadow-[#d63c6a]/10 active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaPuzzlePiece className="h-4 w-4 text-[#d63c6a]" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#a0a0a0]">Extensions</p>
                    </div>
                    <FaChevronRight className="h-3 w-3 text-[#333] transition-colors group-hover:text-[#d63c6a]" />
                  </div>
                  <div className="mt-1.5 flex-1">
                    <p className="text-3xl font-bold text-white">{info?.extensionsCount}</p>
                    <p className="mt-1 text-sm text-[#a0a0a0]">{info?.enabledExtensions} active</p>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#2a2a2a]">
                    <div
                      className="h-full bg-[#d63c6a] transition-all duration-500"
                      style={{
                        width: info?.extensionsCount! > 0 ? `${(info?.enabledExtensions! / info?.extensionsCount!) * 100}%` : "0%",
                      }}
                    ></div>
                  </div>
                </Link>

                <Link
                  to={"/themes"}
                  className="group relative flex flex-col overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#121418] p-2 text-left transition-all hover:border-[#d63c6a] hover:shadow-lg hover:shadow-[#d63c6a]/10 active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaPalette className="h-4 w-4 text-[#d63c6a]" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#a0a0a0]">Themes</p>
                    </div>
                    <FaChevronRight className="h-3 w-3 text-[#333] transition-colors group-hover:text-[#d63c6a]" />
                  </div>
                  <div className="mt-1.5 flex-1">
                    <p className="text-3xl font-bold text-white">{info?.themesCount}</p>
                    <p className="mt-1 text-sm text-[#a0a0a0]">Available</p>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#2a2a2a]">
                    <div className="h-full w-full bg-gradient-to-r from-[#d63c6a] to-[#c52c5a] transition-all duration-500"></div>
                  </div>
                </Link>

                <Link
                  to={"/apps"}
                  className="group relative flex flex-col overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#121418] p-2 text-left transition-all hover:border-[#d63c6a] hover:shadow-lg hover:shadow-[#d63c6a]/10 active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaAppStore className="h-4 w-4 text-[#d63c6a]" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#a0a0a0]">Apps</p>
                    </div>
                    <FaChevronRight className="h-3 w-3 text-[#333] transition-colors group-hover:text-[#d63c6a]" />
                  </div>
                  <div className="mt-1.5 flex-1">
                    <p className="text-3xl font-bold text-white">{info?.appsCount}</p>
                    <p className="mt-1 text-sm text-[#a0a0a0]">{info?.enabledApps} active</p>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#2a2a2a]">
                    <div
                      className="h-full bg-[#d63c6a] transition-all duration-500"
                      style={{
                        width: info?.appsCount! > 0 ? `${(info?.enabledApps! / info?.appsCount!) * 100}%` : "0%",
                      }}
                    ></div>
                  </div>
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-[#2a2a2a] bg-[#121418] p-4 transition-all">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#d63c6a]">Spotify Client</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-[#0a0c0f]/45 p-3">
                      <span className="text-sm text-[#a0a0a0]">Status</span>
                      <span className="flex items-center gap-2 text-sm font-semibold text-white">
                        {status.spotify ? (
                          <>
                            <span className="h-2 w-2 rounded-full bg-green-500"></span>
                            Installed
                          </>
                        ) : (
                          <>
                            <span className="h-2 w-2 rounded-full bg-red-500"></span>
                            Not Installed
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-[#0a0c0f]/45 p-3">
                      <span className="text-sm text-[#a0a0a0]">Version</span>
                      <span className="text-sm font-semibold text-white">{info?.spotifyVersion || "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-[#2a2a2a] bg-[#121418] p-4 transition-all">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#d63c6a]">Spicetify CLI</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-[#0a0c0f]/45 p-3">
                      <span className="text-sm text-[#a0a0a0]">Status</span>
                      <span className="flex items-center gap-2 text-sm font-semibold text-white">
                        {status.spicetify ? (
                          <>
                            <span className="h-2 w-2 rounded-full bg-green-500"></span>
                            Installed
                          </>
                        ) : (
                          <>
                            <span className="h-2 w-2 rounded-full bg-red-500"></span>
                            Not Installed
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-[#0a0c0f]/45 p-3">
                      <span className="text-sm text-[#a0a0a0]">Version</span>
                      <span className="text-sm font-semibold text-white">{info?.spicetifyVersion || "—"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
