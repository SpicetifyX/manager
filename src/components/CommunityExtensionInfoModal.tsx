import React from "react";
import { FaStar, FaClock, FaTimes, FaTrash, FaDownload } from "react-icons/fa";
import { CardItem } from "../utils/marketplace-types";
import Spinner from "./Spinner";
import { AddonInfo } from "../types/addon";

interface CommunityExtensionInfoModalProps {
  showInfoModal: boolean;
  selectedExtension: CardItem | null;
  setShowInfoModal: (value: boolean) => void;
  formatDate: (date: string) => string;
  addons: AddonInfo[];
  handleDeleteAddon: (addonFileName: string, addonName: string) => void;
  handleDownloadClick: (ext: CardItem) => void;
  downloadingId: string | null;
}

const CommunityExtensionInfoModal: React.FC<CommunityExtensionInfoModalProps> = ({
  showInfoModal,
  selectedExtension,
  setShowInfoModal,
  formatDate,
  addons,
  handleDeleteAddon,
  handleDownloadClick,
  downloadingId,
}) => {
  if (!showInfoModal || !selectedExtension) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#121418] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2a2a2a] p-5">
          <div className="flex-1 pr-12">
            <h2 className="text-xl font-bold text-white">{selectedExtension.title}</h2>
            <p className="text-sm text-[#a0a0a0]">{selectedExtension.subtitle}</p>
          </div>
          <button
            onClick={() => setShowInfoModal(false)}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-[#a0a0a0] transition-colors hover:bg-[#2a2a2a] hover:text-white"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="custom-scrollbar flex-1 overflow-y-auto p-5">
          <div className="space-y-4">
            {/* Stats */}
            <div className="flex gap-4">
              <div className="flex items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#0c0e11] px-4 py-2">
                <FaStar className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-white">{selectedExtension.stargazers_count || 0} stars</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#0c0e11] px-4 py-2">
                <FaClock className="h-4 w-4 text-[#a0a0a0]" />
                                  <span className="text-sm text-white">Updated {formatDate(selectedExtension.lastUpdated)}</span>
                                  </div>
                                </div>
                
                                {/* Author */}
                                {selectedExtension.authors && selectedExtension.authors.length > 0 && (
                                  <div>
                                    <h3 className="mb-2 text-sm font-semibold text-white">Author</h3>
                                    {selectedExtension.authors.map((author) => (
                                      <a
                                        key={author.name}
                                        href={author.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 rounded-lg p-2 hover:bg-[#2a2a2a]"
                                      >
                                        <img src={`${author.url}.png`} alt={author.name} className="h-8 w-8 rounded-full" />
                                        <span className="text-sm text-white">{author.name}</span>
                                      </a>
                                    ))}
                                  </div>
                                )}
                
                                {/* Preview Image - only show if image exists and has valid extension */}
                                {selectedExtension.imageURL &&
                                  (selectedExtension.imageURL.includes("png") ||
                                    selectedExtension.imageURL.includes("jpg") ||
                                    selectedExtension.imageURL.includes("gif") ||
                                    selectedExtension.imageURL.includes("jpeg")) && (
                                    <div>
                                      <h3 className="mb-2 text-sm font-semibold text-white">Preview</h3>
                                      <img
                                        src={selectedExtension.imageURL}
                                        alt={selectedExtension.title}
                                        className="w-full rounded-lg border border-[#2a2a2a] object-contain"
                                      />
                                    </div>
                                  )}
                              </div>
                            </div>
        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#2a2a2a] p-5">
          <button
            onClick={() => setShowInfoModal(false)}
            className="rounded-lg border border-[#2a2a2a] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2a2a2a]"
          >
            Close
          </button>
          {selectedExtension.installed ? (
            <button
              onClick={() => {
                const addon = addons.find((a) => a.name === selectedExtension.title);
                if (addon) {
                  handleDeleteAddon(addon.addonFileName, addon.name);
                  setShowInfoModal(false);
                }
              }}
              className="flex items-center gap-2 rounded-lg border border-red-500 bg-red-500/10 px-6 py-2 text-sm font-semibold text-red-500 transition-all hover:bg-red-500 hover:text-white"
            >
              <FaTrash />
              Delete Extension
            </button>
          ) : (
            <button
              onClick={() => {
                handleDownloadClick(selectedExtension);
                setShowInfoModal(false);
              }}
              disabled={downloadingId === selectedExtension.title}
              className="flex items-center gap-2 rounded-lg bg-[#d63c6a] px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-[#c52c5a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloadingId === selectedExtension.title ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Installing...
                </>
              ) : (
                <>
                  <FaDownload />
                  Install Extension
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityExtensionInfoModal;
