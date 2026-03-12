import { FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import Spinner from "./Spinner";

export type ApplyPhase = "applying" | "success" | "error";

interface ApplyModalProps {
  phase: ApplyPhase;
  errorMessage?: string;
  onClose: () => void;
}

export default function ApplyModal({ phase, errorMessage, onClose }: ApplyModalProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative flex w-full max-w-sm flex-col items-center overflow-hidden rounded-xl border border-[#2a2a2a] bg-main p-8 shadow-2xl">
        {phase === "applying" && (
          <>
            <Spinner className="mb-6 h-12 w-12" />
            <h2 className="mb-2 text-lg font-bold text-white">Applying Changes</h2>
            <p className="text-center text-sm text-[#a0a0a0]">Spotify will restart automatically once done...</p>
          </>
        )}

        {phase === "success" && (
          <>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20">
              <FaCheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <h2 className="mb-2 text-lg font-bold text-white">All Applied!</h2>
            <p className="mb-5 text-center text-sm text-[#a0a0a0]">Your changes have been applied. Spotify is restarting.</p>
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-hover active:scale-95"
            >
              Done
            </button>
          </>
        )}

        {phase === "error" && (
          <>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20">
              <FaExclamationTriangle className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="mb-2 text-lg font-bold text-white">Apply Failed</h2>
            <p className="mb-4 text-center text-sm text-[#a0a0a0]">
              {errorMessage || "Something went wrong while applying your changes."}
            </p>
            <div className="mb-5 w-full rounded-lg bg-error-light p-3 border border-red-800/40">
              <p className="text-xs text-red-400">Your changes were not saved. You can try again or reset.</p>
            </div>
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-[#2a2a2a] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#3a3a3a] active:scale-95"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}
