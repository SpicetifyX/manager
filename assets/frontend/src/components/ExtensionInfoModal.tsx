import { FaTimes, FaStar, FaUser, FaTag, FaCalendar, FaDownload } from "react-icons/fa";
import Spinner from "./Spinner";
import { app } from "../../wailsjs/go/models";
import * as backend from "../../wailsjs/go/app/App";

export default function ExtensionInfoModal({ extension, onClose }: { extension: app.AddonInfo; onClose: () => void }) {
  const imageSrc = extension.preview || extension.imageURL;
  const hasImage = imageSrc && /\.(png|jpg|jpeg|gif|webp|svg)/i.test(imageSrc);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#121418] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-48 w-full flex-shrink-0 overflow-hidden">
          {hasImage ? (
            <>
              <div className="absolute inset-0 scale-125 bg-cover bg-center blur-2xl" style={{ backgroundImage: `url(${imageSrc})` }} />
              <div className="absolute inset-0 bg-black/40" />
              <img
                src={imageSrc}
                className="relative z-0 h-full w-full object-contain"
                alt=""
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1e2228] to-[#121418]">
              <img src="/spicetifyx-logo.png" alt="SpicetifyX" className="h-20 w-20 opacity-40" />
            </div>
          )}

          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
          >
            <FaTimes className="h-4 w-4" />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto p-5">
          <h2 className="mb-1 text-xl font-bold text-white">{extension.name}</h2>

          {extension.description && <p className="mb-4 text-sm leading-relaxed text-[#a0a0a0]">{extension.description}</p>}

          <div className="flex flex-col gap-2">
            {extension.authors && extension.authors.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-[#a0a0a0]">
                <FaUser className="h-3 w-3 flex-shrink-0" />
                <span>
                  {extension.authors.map((a, i) =>
                    a.url ? (
                      <span key={i}>
                        {i > 0 && ", "}
                        <button className="text-[#d63c6a] hover:underline" onClick={() => backend.OpenExternalLink(a.url || "")}>
                          {a.name}
                        </button>
                      </span>
                    ) : (
                      <span key={i}>
                        {i > 0 && ", "}
                        {a.name}
                      </span>
                    ),
                  )}
                </span>
              </div>
            )}

            {extension.tags && extension.tags.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-[#a0a0a0]">
                <FaTag className="h-3 w-3 flex-shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {extension.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-[#2a2e34] px-2 py-0.5 text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
