import { useEffect, useState } from "react";
import { FaSync, FaCheckCircle, FaExclamationTriangle, FaPuzzlePiece, FaPalette, FaAppStore, FaChevronRight, FaRocket } from "react-icons/fa";
import RestoreModal from "./RestoreModal";
import * as backend from "../../wailsjs/go/app/App";
import { onRestoreComplete } from "../utils/bridge";
import { useSpicetify } from "../context/SpicetifyContext";

export default function Dashboard({
  installStatus,
  onNavigate,
}: {
  installStatus: {
    spicetify_installed: boolean;
    spotify_installed: boolean;
    already_patched: boolean;
  };
  onNavigate?: (tab: string) => void;
}) {
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showReloadModal, setShowReloadModal] = useState(false);
  const [isRestoringProcess, setIsRestoringProcess] = useState(false);
  const [restoreOutputError, setRestoreOutputError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  const handleReload = async () => {
    setIsReloading(true);
    try {
      await backend.ReloadSpicetify();
    } catch (err) {
      console.error("Reload failed:", err);
    } finally {
      setIsReloading(false);
    }
  };

  const { extensions, themes, apps, spotifyVersion, spicetifyVersion, extensionsLoaded, themesLoaded, appsLoaded } = useSpicetify();

  const extensionsCount = extensions.length;
  const activeExtensions = extensions.filter((ext) => ext.isEnabled).length;
  const themesCount = themes.length;
  const appsCount = apps.length;
  const activeApps = apps.filter((a) => a.isEnabled).length;
  const loading = !extensionsLoaded && !themesLoaded && !appsLoaded && spotifyVersion === null;

  const handleRestore = () => {
    setShowRestoreModal(true);
    setRestoreOutputError(null);
    setRestoreSuccess(false);
  };

  const handleConfirmRestore = () => {
    setIsRestoringProcess(true);
    setRestoreOutputError(null);
    backend.StartRestore();
  };

  const handleCancelRestore = () => {
    setShowRestoreModal(false);
    setRestoreOutputError(null);
    setRestoreSuccess(false);
  };

  const handleRestoreSuccessClose = () => {
    backend.WindowClose();
  };

  useEffect(() => {
    const handleRestoreComplete = (_event: any, { success, error }: { success: boolean; error?: string }) => {
      setIsRestoringProcess(false);
      if (success) {
        console.log("Restore completed successfully.");
        setRestoreSuccess(true);
      } else {
        setRestoreOutputError(error || "An unknown error occurred during restoration.");
      }
    };

    const unsubscribe = onRestoreComplete(handleRestoreComplete);

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="flex h-full w-full flex-col overflow-x-hidden overflow-y-auto bg-[#171b20] p-5">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-[#a0a0a0]">Overview of your Spicetify installation</p>
      </div>

      {loading ? (
        <div className="flex w-full flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2a2a2a] border-t-[#d63c6a]"></div>
            <p className="text-sm text-[#a0a0a0]">Loading dashboard...</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col space-y-4">
          <div className="overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#121418] px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {installStatus.already_patched ? (
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowReloadModal(true)}
                  disabled={isReloading}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                    isReloading
                      ? "cursor-not-allowed bg-[#1e2228] text-[#a0a0a0]"
                      : "bg-[#1e2228] text-[#a0a0a0] hover:bg-[#2a2e34] hover:text-white active:scale-95"
                  }`}
                >
                  <FaRocket className={isReloading ? "animate-pulse" : ""} />
                  {isReloading ? "Reloading..." : "Reload"}
                </button>
                <button
                  onClick={handleRestore}
                  disabled={isRestoringProcess}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                    isRestoringProcess
                      ? "cursor-not-allowed bg-[#a02950] text-white"
                      : "bg-[#d63c6a] text-white hover:bg-[#c52c5a] active:scale-95 active:bg-[#b51c4a]"
                  }`}
                >
                  <FaSync className={isRestoringProcess ? "animate-spin" : ""} />
                  {isRestoringProcess ? "Restoring..." : "Restore"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => onNavigate?.("addons")}
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
                <p className="text-3xl font-bold text-white">{extensionsCount}</p>
                <p className="mt-1 text-sm text-[#a0a0a0]">{activeExtensions} active</p>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#2a2a2a]">
                <div
                  className="h-full bg-[#d63c6a] transition-all duration-500"
                  style={{
                    width: extensionsCount > 0 ? `${(activeExtensions / extensionsCount) * 100}%` : "0%",
                  }}
                ></div>
              </div>
            </button>

            <button
              onClick={() => onNavigate?.("themes")}
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
                <p className="text-3xl font-bold text-white">{themesCount}</p>
                <p className="mt-1 text-sm text-[#a0a0a0]">Available</p>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#2a2a2a]">
                <div className="h-full w-full bg-gradient-to-r from-[#d63c6a] to-[#c52c5a] transition-all duration-500"></div>
              </div>
            </button>

            <button
              onClick={() => onNavigate?.("apps")}
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
                <p className="text-3xl font-bold text-white">{appsCount}</p>
                <p className="mt-1 text-sm text-[#a0a0a0]">{activeApps} active</p>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#2a2a2a]">
                <div
                  className="h-full bg-[#d63c6a] transition-all duration-500"
                  style={{
                    width: appsCount > 0 ? `${(activeApps / appsCount) * 100}%` : "0%",
                  }}
                ></div>
              </div>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-[#2a2a2a] bg-[#121418] p-4 transition-all">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#d63c6a]">Spotify Client</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-[#0a0c0f]/45 p-3">
                  <span className="text-sm text-[#a0a0a0]">Status</span>
                  <span className="flex items-center gap-2 text-sm font-semibold text-white">
                    {installStatus.spotify_installed ? (
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
                  <span className="text-sm font-semibold text-white">{spotifyVersion || "—"}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#2a2a2a] bg-[#121418] p-4 transition-all">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#d63c6a]">Spicetify CLI</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-[#0a0c0f]/45 p-3">
                  <span className="text-sm text-[#a0a0a0]">Status</span>
                  <span className="flex items-center gap-2 text-sm font-semibold text-white">
                    {installStatus.spicetify_installed ? (
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
                  <span className="text-sm font-semibold text-white">{spicetifyVersion || "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <RestoreModal
        show={showRestoreModal}
        onConfirm={handleConfirmRestore}
        onCancel={handleCancelRestore}
        isRestoring={isRestoringProcess}
        restoreError={restoreOutputError}
        restoreSuccess={restoreSuccess}
        onSuccessClose={handleRestoreSuccessClose}
      />

      {showReloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75">
          <div className="flex w-full max-w-sm flex-col rounded-lg border border-[#2a2a2a] bg-[#121418] p-6 shadow-lg">
            <div className="mb-4 flex flex-col items-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#1e2228]">
                <FaRocket className="h-6 w-6 text-[#d63c6a]" />
              </div>
              <h2 className="mb-1 text-lg font-bold text-white">Reload Spicetify</h2>
              <p className="text-center text-sm text-[#a0a0a0]">
                This will run <span className="font-mono text-white">spicetify apply</span> to reload your current theme and extensions.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReloadModal(false)}
                className="flex-1 rounded-md border border-[#2a2a2a] bg-transparent px-4 py-2.5 text-sm font-semibold text-[#a0a0a0] transition hover:bg-[#1e2228] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowReloadModal(false); handleReload(); }}
                className="flex-1 rounded-md bg-[#d63c6a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c52c5a] active:bg-[#b51c4a]"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
