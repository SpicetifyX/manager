import { useState } from "react";
import { FaCog, FaRocket } from "react-icons/fa";
import ApplyModal from "./ApplyModal";

export default function PendingChangesBar({ onApplied, onReset }: { onApplied: () => void; onReset: () => void }) {
  const [isApplying, setIsApplying] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    setShowModal(true);
    try {
      await window.electron.applySpicetify();
    } catch (err) {
      console.error("[PendingChangesBar] Failed to apply:", err);
    } finally {
      setIsApplying(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    onApplied();
  };

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 p-5">
        <div className="pointer-events-auto flex items-center justify-between rounded-xl border border-[#2a2a2a] bg-[#0e1114]/95 px-4 py-2.5 shadow-2xl shadow-black/60 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#d63c6a]" />
            <span className="text-sm text-[#a0a0a0]">
              Unsaved changes, Spotify needs to restart to apply them.
            </span>
          </div>
          <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            disabled={isApplying}
            className="flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-1.5 text-sm font-semibold text-[#a0a0a0] transition-all hover:border-[#3a3a3a] hover:bg-[#1e2228] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            disabled={isApplying}
            className="flex items-center gap-2 rounded-full bg-[#d63c6a] px-4 py-1.5 text-sm font-semibold text-white transition-all hover:bg-[#c52c5a] active:bg-[#b51c4a] disabled:cursor-not-allowed disabled:opacity-60"
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
      {showModal && (
        <ApplyModal
          action="Applying Changes"
          items={["Restarting Spotify with your changes"]}
          isApplying={isApplying}
          onClose={handleModalClose}
        />
      )}
    </>
  );
}
