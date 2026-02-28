import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ThemeInfo } from "../types/theme.d";
import Spinner from "./Spinner";
import { FaInfoCircle, FaTrash, FaPalette, FaChevronDown } from "react-icons/fa";
import InfoModal, { InfoData } from "./InfoModal";
import StaticImage from "./StaticImage";

export default function Theme({
  theme,
  onSelect,
  onSetColorScheme,
  onDelete,
  isApplying,
}: {
  theme: ThemeInfo;
  onSelect: (themeId: string) => void;
  onSetColorScheme: (themeId: string, scheme: string) => void;
  onDelete?: (themeId: string) => void;
  isApplying: boolean;
}) {
  const [showInfo, setShowInfo] = useState(false);
  const [schemeOpen, setSchemeOpen] = useState(false);
  const schemeRef = useRef<HTMLDivElement>(null);
  const schemeButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const schemes = theme.colorSchemes && theme.colorSchemes.length > 0 ? theme.colorSchemes : ["Default"];
  const [selectedScheme, setSelectedScheme] = useState(theme.activeColorScheme || schemes[0]);

  const openDropdown = () => {
    if (isApplying) return;
    if (schemeButtonRef.current) {
      const rect = schemeButtonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
    }
    setSchemeOpen((o) => !o);
  };

  useEffect(() => {
    setSelectedScheme(theme.activeColorScheme || schemes[0]);
  }, [theme.activeColorScheme]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideButton = schemeRef.current?.contains(target);
      const insideDropdown = dropdownRef.current?.contains(target);
      if (!insideButton && !insideDropdown) setSchemeOpen(false);
    };
    if (schemeOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [schemeOpen]);

  const infoData: InfoData = {
    title: theme.name,
    description: theme.description,
    resolvedImageSrc: theme.preview,
    imageURL: theme.imageURL,
    authors: theme.authors,
    tags: theme.tags,
    installed: true,
  };

  const handleShowInfo = () => {
    console.log(`[Theme] Opening info for ${theme.name}`);
    console.log(`[Theme] Preview exists: ${!!theme.preview}, length: ${theme.preview?.length}`);
    console.log(`[Theme] ImageURL: ${theme.imageURL}`);
    setShowInfo(true);
  };

  return (
    <>
      <div className="flex w-full items-center justify-between border-b border-[#2a2a2a] px-4 py-3 transition-colors duration-200 hover:bg-[#1e2228]">
        <div className="flex min-w-0 flex-grow items-center">
          <div className="mr-4 h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
            <StaticImage
              src={theme.preview}
              fallbackSrc={theme.imageURL}
              alt={`${theme.name} preview`}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1 pr-4">
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
          {theme.isActive && theme.colorSchemes && theme.colorSchemes.length > 1 && (
            <div ref={schemeRef}>
              <button
                ref={schemeButtonRef}
                onClick={openDropdown}
                disabled={isApplying}
                className="flex h-8 items-center gap-1.5 rounded-full border border-[#2a2a2a] bg-[#1a1a1a] pr-2.5 pl-2.5 text-sm text-white transition-all hover:border-[#3a3a3a] hover:bg-[#1e2228] disabled:opacity-50"
                title="Color scheme"
              >
                <FaPalette className="h-3 w-3 text-[#d63c6a]" />
                <span className="max-w-[80px] truncate text-[#ccc]">{selectedScheme}</span>
                <FaChevronDown className={`h-2.5 w-2.5 text-[#666] transition-transform duration-200 ${schemeOpen ? "rotate-180" : ""}`} />
              </button>
              {schemeOpen &&
                createPortal(
                  <div
                    ref={dropdownRef}
                    style={{ top: dropdownPos.top, right: dropdownPos.right }}
                    className="fixed z-[9999] min-w-[140px] rounded-lg border border-[#2a2a2a] bg-[#161a1e] p-1 shadow-xl shadow-black/40"
                  >
                    <div className="custom-scrollbar max-h-48 overflow-y-auto">
                      {schemes.map((scheme) => (
                        <button
                          key={scheme}
                          onClick={() => {
                            if (scheme === selectedScheme) {
                              setSchemeOpen(false);
                              return;
                            }
                            setSelectedScheme(scheme);
                            setSchemeOpen(false);
                            onSetColorScheme(theme.id, scheme);
                          }}
                          className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${selectedScheme === scheme ? "bg-[#d63c6a]/15 text-[#d63c6a]" : "text-[#ccc] hover:bg-[#1e2228] hover:text-white"
                            }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${selectedScheme === scheme ? "bg-[#d63c6a]" : "bg-transparent"}`}
                          />
                          <span className="truncate">{scheme}</span>
                        </button>
                      ))}
                    </div>
                  </div>,
                  document.body,
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

      {showInfo && <InfoModal info={infoData} onClose={() => setShowInfo(false)} />}
    </>
  );
}
