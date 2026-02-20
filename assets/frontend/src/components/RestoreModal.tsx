import { useRef, useEffect } from "react";
import TerminalOutput, { TerminalOutputRef } from "./TerminalOutput";
import { FaSync } from "react-icons/fa";
import { onCommandOutput } from "../utils/bridge";

interface RestoreModalProps {
  show: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isRestoring: boolean;
  restoreError: string | null;
  restoreSuccess: boolean;
  onSuccessClose: () => void;
}

export default function RestoreModal({ show, onConfirm, onCancel, isRestoring, restoreError, restoreSuccess, onSuccessClose }: RestoreModalProps) {
  const terminalRef = useRef<TerminalOutputRef>(null);

  useEffect(() => {
    const listener = (_event: any, data: string) => {
      terminalRef.current?.write(data);
    };

    if (show) {
      terminalRef.current?.clear();
      const unsub = onCommandOutput(listener);
      return () => {
        unsub();
      };
    }
  }, [show]);

  if (!show) {
    return null;
  }

  if (restoreSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
        <div className="flex w-full max-w-md flex-col rounded-lg border border-[#2a2a2a] bg-[#121418] p-6 shadow-lg">
          <div className="mb-6 flex flex-col items-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#2a2a2a]">
              <FaSync className="h-8 w-8 text-white" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-white">Restore Complete</h2>
            <p className="text-center text-sm text-[#a0a0a0]">
              Spotify has been restored to its original state. All Spicetify customizations have been removed.
            </p>
          </div>
          <button
            onClick={onSuccessClose}
            className="w-full rounded-md bg-[#d63c6a] px-4 py-3 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#c52c5a] active:bg-[#b51c4a]"
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className={`flex ${isRestoring ? "h-[75%] w-full" : "h-[40%] w-[75%] max-w-lg"} max-w-2xl flex-col rounded-lg bg-[#121418] p-5 shadow-lg`}>
        {!isRestoring ? (
          <>
            <div className="flex-1">
              <h2 className="mb-4 text-xl font-bold text-white">Confirm Restore</h2>
              <p className="mb-4 text-[#a0a0a0]">
                Are you sure you want to restore Spicetify to its default configuration? This will remove all installed themes and extensions.
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Status bar */}
            <div className="mb-4 flex items-center justify-between rounded-lg border border-[#2a2a2a] bg-[#121418] p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d63c6a]">
                  <FaSync className="h-5 w-5 animate-spin text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Restoring Spotify</h3>
                  <p className="text-xs text-[#a0a0a0]">Removing customizations and restoring defaults</p>
                </div>
              </div>
            </div>
          </>
        )}

        {isRestoring && (
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
        )}

        {restoreError && (
          <div className="mt-4 rounded-lg bg-[#3c1212] p-3">
            <p className="text-xs text-[#ff9999]">{restoreError}</p>
          </div>
        )}

        {!isRestoring && (
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onCancel}
              disabled={isRestoring}
              className="rounded-md bg-gray-600 px-4 py-2 text-white duration-150 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isRestoring}
              className="flex items-center justify-center gap-2 rounded-md bg-[#d63c6a] px-4 py-2 text-white duration-150 hover:bg-[#c52c5a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confirm Restore
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
