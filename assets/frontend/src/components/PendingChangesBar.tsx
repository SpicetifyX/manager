import { useState } from "react";
import { FaCog, FaRocket } from "react-icons/fa";
import ApplyModal, { ApplyPhase } from "./ApplyModal";
import { useSpicetify } from "../context/SpicetifyContext";

export default function PendingChangesBar({ onApplied, onReset }: { onApplied: () => void; onReset: () => void }) {
  const [phase, setPhase] = useState<"idle" | ApplyPhase>("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const { commitChanges, resetChanges } = useSpicetify();

  const isApplying = phase === "applying";

  const handleApply = async () => {
    setErrorMessage(undefined);
    setPhase("applying");
    try {
      await commitChanges();
      setPhase("success");
    } catch (err: any) {
      console.error("[PendingChangesBar] Failed to apply:", err);
      const msg = typeof err === "string" ? err : err?.message ?? "An unexpected error occurred.";
      setErrorMessage(msg);
      setPhase("error");
    }
  };

  const handleReset = async () => {
    await resetChanges();
    onReset();
  };

  const handleModalClose = () => {
    if (phase === "success") {
      onApplied();
    }
    setPhase("idle");
  };

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 p-5">
        <div className="pointer-events-auto flex items-center justify-between rounded-xl border border-[#2a2a2a] bg-overlay/95 px-4 py-2.5 shadow-2xl shadow-black/60 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
            <span className="text-sm text-[#a0a0a0]">Unsaved changes. Spotify will restart to apply them.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              disabled={isApplying}
              className="flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-dark px-4 py-1.5 text-sm font-semibold text-[#a0a0a0] transition-all hover:border-[#3a3a3a] hover:bg-tertiary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Reset
            </button>
            <button
              onClick={handleApply}
              disabled={isApplying}
              className="flex items-center gap-2 rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white transition-all hover:bg-brand-hover active:bg-brand-active disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isApplying ? (
                <>
                  <FaCog className="h-3.5 w-3.5 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <FaRocket className="h-3.5 w-3.5" />
                  Apply
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      {phase !== "idle" && (
        <ApplyModal phase={phase} errorMessage={errorMessage} onClose={handleModalClose} />
      )}
    </>
  );
}

