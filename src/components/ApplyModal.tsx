import { useEffect, useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import Spinner from "./Spinner";

interface ApplyModalProps {
  action: string;
  items: string[];
  isApplying: boolean;
  onClose: () => void;
}

export default function ApplyModal({ action, items, isApplying, onClose }: ApplyModalProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!isApplying) {
      setShowSuccess(true);
    }
  }, [isApplying]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative flex w-full max-w-sm flex-col items-center overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#121418] p-8 shadow-2xl">
        {!showSuccess ? (
          <>
            <Spinner className="mb-6 h-12 w-12" />
            <h2 className="mb-2 text-lg font-bold text-white">{action}</h2>
            <p className="text-sm text-[#a0a0a0]">Spotify will restart automatically...</p>
          </>
        ) : (
          <>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20">
              <FaCheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <h2 className="mb-3 text-lg font-bold text-white">All Applied!</h2>
            {items.length > 0 && (
              <div className="mb-5 w-full rounded-lg bg-[#1e2228] p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#a0a0a0]">Changes applied</p>
                <ul className="space-y-1">
                  {items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-white">
                      <FaCheckCircle className="h-3 w-3 flex-shrink-0 text-green-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-[#d63c6a] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#c52c5a]"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}
