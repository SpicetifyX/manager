import { useEffect, useRef, useState } from "react";
import { ThemeInfo } from "../types/theme.d";
import Spinner from "./Spinner";
import { FaInfoCircle, FaTrash, FaPalette, FaChevronDown } from "react-icons/fa";
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
  const [schemeOpen, setSchemeOpen] = useState(false);
  const [applyingScheme, setApplyingScheme] = useState(false);
  const schemeRef = useRef<HTMLDivElement>(null);
  const schemes = theme.colorSchemes && theme.colorSchemes.length > 0 ? theme.colorSchemes : ["Default"];
  const [selectedScheme, setSelectedScheme] = useState(
    theme.activeColorScheme || schemes[0],
  );

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (schemeRef.current && !schemeRef.current.contains(e.target as Node)) {
        setSchemeOpen(false);
      }
    };
    if (schemeOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [schemeOpen]);

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
          {theme.isActive && (
          <div className="relative" ref={schemeRef}>
            <button
              onClick={() => !isApplying && !applyingScheme && setSchemeOpen(!schemeOpen)}
              disabled={isApplying || applyingScheme}
              className="flex h-8 items-center gap-1.5 rounded-full border border-[#2a2a2a] bg-[#1a1a1a] pr-2.5 pl-2.5 text-sm text-white transition-all hover:border-[#3a3a3a] hover:bg-[#1e2228] disabled:opacity-50"
              title="Color scheme"
            >
              {applyingScheme ? (
                <Spinner className="h-3 w-3" />
              ) : (
                <FaPalette className="h-3 w-3 text-[#d63c6a]" />
              )}
              <span className="max-w-[80px] truncate text-[#ccc]">{selectedScheme}</span>
              <FaChevronDown className={`h-2.5 w-2.5 text-[#666] transition-transform duration-200 ${schemeOpen ? "rotate-180" : ""}`} />
            </button>
            {schemeOpen && (
              <div className="absolute right-0 z-50 mt-1.5 min-w-[140px] rounded-lg border border-[#2a2a2a] bg-[#161a1e] p-1 shadow-xl shadow-black/40">
                <div className="custom-scrollbar max-h-48 overflow-y-auto">
                  {schemes.map((scheme) => (
                    <button
                      key={scheme}
                      onClick={async () => {
                        if (scheme === selectedScheme) {
                          setSchemeOpen(false);
                          return;
                        }
                        setSelectedScheme(scheme);
                        setSchemeOpen(false);
                        setApplyingScheme(true);
                        try {
                          await window.electron.setColorScheme(theme.id, scheme);
                        } catch (err) {
                          console.error("Failed to set color scheme:", err);
                        } finally {
                          setApplyingScheme(false);
                        }
                      }}
                      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                        selectedScheme === scheme
                          ? "bg-[#d63c6a]/15 text-[#d63c6a]"
                          : "text-[#ccc] hover:bg-[#1e2228] hover:text-white"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${selectedScheme === scheme ? "bg-[#d63c6a]" : "bg-transparent"}`} />
                      <span className="truncate">{scheme}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
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
