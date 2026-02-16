import { useEffect, useState } from "react";
import { AddonInfo } from "../types/addon.d";
import { FaCheck, FaInfoCircle, FaTrash } from "react-icons/fa";
import Spinner from "./Spinner";

export default function AddonCard({
  addon,
  togglingId,
  onToggle,
  onDelete,
  isDeleting,
}: {
  addon: AddonInfo;
  togglingId: string | null;
  onToggle: (fileName: string, enable: boolean) => void;
  onDelete: (fileName: string, name: string) => void;
  isDeleting: boolean;
}) {
  const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (addon.preview) {
      window.electron.getAddonAssetPath(addon.preview).then((resolvedPath: string) => {
        setImageSrc(resolvedPath);
      });
    }
  }, [addon.preview]);

  return (
    <div
      className={`flex items-center justify-between rounded-lg border p-4 transition-all ${
        addon.isEnabled ? "border-[#d63c6a] bg-[#1a1418]" : "border-[#2a2a2a] bg-[#121418] hover:border-[#3a3a3a]"
      }`}
    >
      <div className="flex flex-1 items-center gap-4">
        {imageSrc ? (
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#0c0e11]">
            <img src={imageSrc} alt={addon.name} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-[#0c0e11]">
            <FaInfoCircle className="h-6 w-6 text-[#a0a0a0]" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-white">{addon.name}</h3>
            {addon.isEnabled && (
              <span className="flex items-center gap-1 rounded-full bg-[#d63c6a] px-2 py-0.5 text-xs font-medium text-white">
                <FaCheck className="h-2.5 w-2.5" />
                Active
              </span>
            )}
          </div>
          <p className="truncate text-sm text-[#a0a0a0]">{addon.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onDelete(addon.addonFileName, addon.name)}
          disabled={togglingId === addon.addonFileName || isDeleting}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#121418] text-[#a0a0a0] transition-all hover:border-red-500 hover:bg-red-500/10 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          title="Delete Extension"
        >
          {isDeleting ? <Spinner className="h-4 w-4" /> : <FaTrash className="h-3.5 w-3.5" />}
        </button>

        <label className="flex cursor-pointer items-center gap-3">
          {togglingId === addon.addonFileName && (
            <div className="flex h-6 w-6 items-center justify-center">
              <Spinner className="h-5 w-5" />
            </div>
          )}
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={addon.isEnabled}
              onChange={(e) => onToggle(addon.addonFileName, e.target.checked)}
              disabled={togglingId === addon.addonFileName || isDeleting}
            />
            <div className={`block h-8 w-14 rounded-full transition-colors ${addon.isEnabled ? "bg-[#d63c6a]" : "bg-[#2a2a2a]"}`}></div>
            <div
              className={`dot absolute top-1 left-1 h-6 w-6 rounded-full bg-white transition-transform ${addon.isEnabled ? "translate-x-full" : ""}`}
            ></div>
          </div>
        </label>
      </div>
    </div>
  );
}
