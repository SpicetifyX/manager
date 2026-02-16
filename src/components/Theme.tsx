import { useEffect, useState } from "react";
import { ThemeInfo } from "../types/theme.d";
import Spinner from "./Spinner";
import { FaInfoCircle, FaTrash } from "react-icons/fa";
import AddonInfoModal, { AddonInfoData } from "./AddonInfoModal";
import StaticImage from "./StaticImage";

export default function Theme({
  theme,
  onSelect,
  onDelete,
  isApplying,
}: {
  theme: ThemeInfo;
  onSelect: (themeId: string) => void;
  onDelete?: (themeId: string) => void;
  isApplying: boolean;
}) {
  const [previewSrc, setPreviewSrc] = useState<string | undefined>(undefined);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (theme.preview) {
      window.electron
        .getThemeAssetPath(theme.preview)
        .then((resolvedPath: string) => {
          if (!cancelled) setPreviewSrc(resolvedPath);
        })
        .catch(() => {});
    } else {
      setPreviewSrc(undefined);
    }
    return () => {
      cancelled = true;
    };
  }, [theme.preview]);

  const infoData: AddonInfoData = {
    title: theme.name,
    description: theme.description,
    resolvedImageSrc: previewSrc,
    authors: theme.authors,
    tags: theme.tags,
    installed: true,
  };

  return (
    <>
      <div className="flex w-full items-center justify-between border-b border-[#2a2a2a] px-4 py-3 transition-colors duration-200 hover:bg-[#1e2228]">
        <div className="flex min-w-0 flex-grow items-center">
          <div className="mr-4 h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
            <StaticImage
              src={previewSrc}
              alt={`${theme.name} preview`}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-white">{theme.name}</h3>
            <p className="truncate text-sm text-[#a0a0a0]">{theme.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInfo(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#a0a0a0] transition-colors hover:bg-[#2a2e34] hover:text-white"
            title="Info"
          >
            <FaInfoCircle className="h-4 w-4" />
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(theme.id)}
              disabled={isApplying}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#a0a0a0] transition-colors hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50"
              title="Delete theme"
            >
              <FaTrash className="h-4 w-4" />
            </button>
          )}
          <div className="relative ml-1">
            {isApplying ? (
              <div className="flex h-8 w-16 items-center justify-center">
                <Spinner className="h-5 w-5" />
              </div>
            ) : (
              <button
                onClick={() => onSelect(theme.id)}
                disabled={theme.isActive}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${theme.isActive ? "cursor-not-allowed bg-[#d63c6a] text-white" : "bg-[#2a2e34] text-[#a0a0a0] hover:bg-[#d63c6a] hover:text-white"}`}
              >
                {theme.isActive ? "Active" : "Select"}
              </button>
            )}
          </div>
        </div>
      </div>

      {showInfo && <AddonInfoModal info={infoData} onClose={() => setShowInfo(false)} />}
    </>
  );
}
