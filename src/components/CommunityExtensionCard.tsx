import React, { useState } from "react";
import { FaInfoCircle, FaCheck, FaDownload, FaStar, FaClock } from "react-icons/fa";
import { CardItem } from "../utils/marketplace-types";
import Spinner from "./Spinner";

const CommunityExtensionCard = React.memo(
  ({
    ext,
    formatDate,
    onInfoClick,
    onDownloadClick,
  }: {
    ext: CardItem;
    formatDate: (date: string) => string;
    onInfoClick: (ext: CardItem) => void;
    onDownloadClick: (ext: CardItem) => void;
  }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const hasImage = ext.imageURL && (ext.imageURL.includes("png") || ext.imageURL.includes("jpg") || ext.imageURL.includes("gif"));

    return (
      <div
        className={`group relative flex h-72 flex-col overflow-hidden rounded-lg border transition-all hover:shadow-lg ${
          ext.installed ? "border-[#d63c6a] bg-[#1a1418]" : "border-[#2a2a2a] bg-[#121418] hover:border-[#3a3a3a]"
        }`}
      >
        {/* Image Section */}
        {hasImage ? (
          <div className="relative h-40 w-full overflow-hidden bg-[#0c0e11]">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Spinner className="h-6 w-6" />
              </div>
            )}
            <div
              className={`absolute inset-0 scale-125 bg-cover bg-center blur-2xl transition-opacity duration-300 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              style={{ backgroundImage: `url(${ext.imageURL})` }}
            />
            <div className="absolute inset-0 bg-black/40" />
            <img
              src={ext.imageURL}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              className={`relative z-10 h-full w-full object-contain transition-opacity duration-300 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              alt={ext.title}
            />

            {/* Hover Overlay */}
            {imageLoaded && (
              <div className="absolute inset-0 z-20 flex items-center justify-center gap-2 bg-black/75 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => onInfoClick(ext)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#1a1a1a] text-white transition-all hover:border-[#d63c6a] hover:bg-[#d63c6a]"
                >
                  <FaInfoCircle />
                </button>
                {ext.installed ? (
                  <button
                    onClick={() => onInfoClick(ext)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white transition-all hover:bg-green-600"
                  >
                    <FaCheck />
                  </button>
                ) : (
                  <button
                    onClick={() => onDownloadClick(ext)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d63c6a] text-white transition-all hover:bg-[#c52c5a]"
                  >
                    <FaDownload />
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="group/nopreview relative flex h-40 w-full items-center justify-center bg-[#0c0e11]">
            <span className="text-xs text-[#a0a0a0]">No Preview</span>

            {/* Hover Overlay for No Preview */}
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/75 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => onInfoClick(ext)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#1a1a1a] text-white transition-all hover:border-[#d63c6a] hover:bg-[#d63c6a]"
              >
                <FaInfoCircle />
              </button>
              {ext.installed ? (
                <button
                  onClick={() => onInfoClick(ext)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white transition-all hover:bg-green-600"
                >
                  <FaCheck />
                </button>
              ) : (
                <button
                  onClick={() => onDownloadClick(ext)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d63c6a] text-white transition-all hover:bg-[#c52c5a]"
                >
                  <FaDownload />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="flex flex-1 flex-col justify-between p-3">
          <div>
            <div className="mb-1 flex items-start justify-between gap-2">
              <h3 className="line-clamp-1 text-sm font-semibold text-white">{ext.title}</h3>
              {ext.installed && (
                <div className="flex-shrink-0 rounded-full bg-[#d63c6a] px-2 py-0.5">
                  <FaCheck className="h-2.5 w-2.5 text-white" />
                </div>
              )}
            </div>
            <p className="line-clamp-2 text-xs text-[#a0a0a0]">{ext.subtitle || "No description"}</p>
          </div>

          {/* Stats */}
          <div className="mt-3 flex items-center justify-between border-t border-[#2a2a2a] pt-2">
            <div className="flex items-center gap-1 text-xs text-[#a0a0a0]">
              <FaStar className="h-3 w-3 text-yellow-500" />
              <span>{ext.stargazers_count || 0}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-[#a0a0a0]">
              <FaClock className="h-3 w-3" />
              <span>{formatDate(ext.lastUpdated)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

CommunityExtensionCard.displayName = "CommunityExtensionCard";

export default CommunityExtensionCard;
