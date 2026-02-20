import { useState, useEffect } from "react";
import { onRestoreComplete } from "../utils/bridge";
import * as backend from "../../wailsjs/go/app/App";
import { FaExclamationTriangle } from "react-icons/fa";

export default function OldInstallFound({ fetchInstall }: { fetchInstall: () => Promise<void> }) {
  const [restoring, setRestoring] = useState(false);
  const [restored, setRestored] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleRestoreComplete = (_event: any, { success, error: restoreError }: { success: boolean; error?: string }) => {
      setRestoring(false);
      if (success) {
        console.log("[OldInstallFound] Restore completed successfully.");
        setRestored(true);
        fetchInstall();
      } else {
        console.error("[OldInstallFound] Restore failed:", restoreError);
        setError(restoreError || "An unknown error occurred during restoration.");
      }
    };

    const unsubscribe = onRestoreComplete(handleRestoreComplete);
    return () => {
      unsubscribe();
    };
  }, []);

  async function handleRestore() {
    setRestoring(true);
    setError(null);
    console.log("[OldInstallFound] Sending start-restore...");
    backend.StartRestore();
  }

  return (
    <div className="w-full h-full flex flex-col items-centerj justify-center">
      <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center space-y-4 rounded-lg border border-[#2a2a2a] bg-[#121418] p-6">
        <FaExclamationTriangle className="w-12 h-12 text-white" />
        <h2 className="text-lg font-bold text-white">Old Installation Found</h2>
        <p className="text-sm text-[#b0b0b0]">
          A previous Spicetify installation was detected. You can restore your backup and reset to default configuration.
        </p>
        <button
          className={`rounded px-5 text-white py-2.5 text-sm font-semibold transition-all duration-200 ${restoring || restored ? "cursor-not-allowed bg-[#d63c6a]" : "bg-[#d63c6a] text-white hover:bg-[#c52c5a] active:bg-[#b51c4a]"}`}
          disabled={restoring || restored}
          onClick={handleRestore}
        >
          {restored ? "Restored!" : restoring ? "Restoring..." : "Restore to Default"}
        </button>
        {error && <div className="mt-2 w-full rounded-lg bg-[#3c1212] p-2 text-center text-xs text-[#ff9999]">Restore failed: {error}</div>}
      </div>
    </div>
  );
}
