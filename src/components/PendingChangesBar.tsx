import { useState } from "react";
import { FaRocket } from "react-icons/fa";
import Spinner from "./Spinner";

export default function PendingChangesBar({ onApplied }: { onApplied: () => void }) {
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await window.electron.applySpicetify();
      onApplied();
    } catch (err) {
      console.error("[PendingChangesBar] Failed to apply:", err);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="flex w-full flex-shrink-0 items-center justify-between border-t border-[#2a2a2a] bg-[#0e1114] px-4 py-2.5">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#d63c6a]" />
        <span className="text-sm text-[#a0a0a0]">
          Unsaved changes, Spotify needs to restart to apply them.
        </span>
      </div>
      <button
        onClick={handleApply}
        disabled={isApplying}
        className="flex items-center gap-2 rounded-full bg-[#d63c6a] px-4 py-1.5 text-sm font-semibold text-white transition-all hover:bg-[#c52c5a] active:bg-[#b51c4a] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isApplying ? (
          <>
            <Spinner className="h-3.5 w-3.5" />
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
  );
}
