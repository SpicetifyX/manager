import { useState } from "react";
import Spinner from "./Spinner";
import { FaTrash, FaInfoCircle } from "react-icons/fa";
import InfoModal, { InfoData } from "./InfoModal";
import StaticImage from "./StaticImage";

export default function Addon({
  name,
  description,
  isEnabled,
  onToggle,
  onDelete,
  preview,
  isToggling,
  addonFileName,
  authors,
  tags,
}: {
  name: string;
  description: string;
  isEnabled: boolean;
  onToggle: (addonFileName: string, enable: boolean) => void;
  onDelete: (addonFileName: string) => void;
  preview?: string;
  isToggling: boolean;
  addonFileName: string;
  authors?: { name: string; url?: string }[];
  tags?: string[];
}) {
  const [showInfo, setShowInfo] = useState(false);

  const infoData: InfoData = {
    title: name,
    description,
    resolvedImageSrc: preview,
    authors,
    tags,
    installed: true,
  };

  return (
    <>
      <div className="flex w-full items-center justify-between border-b border-[#2a2a2a] px-4 py-3 transition-colors duration-200 hover:bg-[#1e2228]">
        <div className="flex min-w-0 flex-grow items-center">
          <div className="mr-4 h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
            <StaticImage src={preview} alt={`${name} preview`} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-white">{name}</h3>
            <p className="truncate text-sm text-[#a0a0a0]">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInfo(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#a0a0a0] transition-colors hover:bg-[#2a2e34] hover:text-white disabled:opacity-50"
            title="Info"
          >
            <FaInfoCircle className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(addonFileName)}
            disabled={isToggling}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#a0a0a0] transition-colors hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50"
            title="Delete extension"
          >
            <FaTrash className="h-4 w-4" />
          </button>
          <label className="flex cursor-pointer items-center gap-3">
            {isToggling && (
              <div className="bg-opacity-50 flex h-6 w-6 items-center justify-center rounded-full bg-black">
                <Spinner className="h-5 w-5" />
              </div>
            )}
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={isEnabled}
                onChange={(e) => onToggle(addonFileName, e.target.checked)}
                disabled={isToggling}
              />
              <div className={`block h-8 w-14 rounded-full ${isEnabled ? "bg-[#d63c6a]" : "bg-gray-600"}`}></div>
              <div className={`dot absolute top-1 left-1 h-6 w-6 rounded-full bg-white transition ${isEnabled ? "translate-x-full" : ""}`}></div>
            </div>
          </label>
        </div>
      </div>

      {showInfo && <InfoModal info={infoData} onClose={() => setShowInfo(false)} />}
    </>
  );
}
