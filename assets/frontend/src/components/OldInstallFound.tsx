import { useState, useEffect, useRef } from "react";
import { onRestoreComplete, onCommandOutput } from "../utils/bridge";
import * as backend from "../../wailsjs/go/app/App";
import { FaExclamationTriangle, FaSync } from "react-icons/fa";
import TerminalOutput, { TerminalOutputRef } from "./TerminalOutput";

export default function OldInstallFound({ fetchInstall }: { fetchInstall: () => Promise<void> }) {
  const [restoring, setRestoring] = useState(false);
  const [restored, setRestored] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const terminalRef = useRef<TerminalOutputRef>(null);

  const busy = restoring;

  useEffect(() => {
    if (busy) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [busy]);

  useEffect(() => {
    const handleRestoreComplete = (_event: any, { success, error: restoreError }: { success: boolean; error?: string }) => {
      setRestoring(false);
      if (success) {
        setRestored(true);
        fetchInstall();
      } else {
        setError(restoreError || "An unknown error occurred during restoration.");
      }
    };

    const handleOutput = (_event: any, data: string) => {
      terminalRef.current?.write(data);
    };

    const unsubRestore = onRestoreComplete(handleRestoreComplete);
    const unsubOutput = onCommandOutput(handleOutput);
    return () => {
      unsubRestore();
      unsubOutput();
    };
  }, []);

  async function handleRestore() {
    terminalRef.current?.clear();
    setRestoring(true);
    setError(null);
    backend.StartRestore();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75">
      <div
        className={`flex flex-col rounded-lg border border-[#2a2a2a] bg-[#121418] shadow-lg transition-all duration-300 ${
          busy ? "h-[75%] w-full max-w-2xl p-5" : "w-full max-w-sm p-6"
        }`}
      >
        {!busy ? (
          <>
            <div className="mb-4 flex flex-col items-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#1e2228]">
                <FaExclamationTriangle className="h-6 w-6 text-yellow-400" />
              </div>
              <h2 className="mb-1 text-lg font-bold text-white">Old Installation Found</h2>
              <p className="text-center text-sm text-[#a0a0a0]">
                A Spicetify installation was found but it is not applied to Spotify. Restore Spotify to its default state to continue.
              </p>
            </div>
            <button
              onClick={handleRestore}
              disabled={restored}
              className="w-full rounded bg-[#d63c6a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c52c5a] active:bg-[#b51c4a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {restored ? "Restored!" : "Restore to Default"}
            </button>
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center rounded-lg border border-[#2a2a2a] bg-[#121418] p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d63c6a]">
                  <FaSync className="h-5 w-5 animate-spin text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Restoring Spotify</h3>
                  <p className="text-xs text-[#a0a0a0]">Removing customizations and restoring defaults.</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#0c0e11]">
              <div className="flex items-center justify-between border-b border-[#2a2a2a] px-3 py-2">
                <span className="text-xs font-medium text-white">Restore Log</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-[#d63c6a]"></div>
                  <span className="text-xs text-[#a0a0a0]">Live</span>
                </div>
              </div>
              <div className="h-full overflow-hidden p-3 font-mono text-xs">
                <TerminalOutput ref={terminalRef} />
              </div>
            </div>
          </>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-[#3c1212] p-3">
            <p className="text-xs text-[#ff9999]">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
