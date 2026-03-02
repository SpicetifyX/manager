import { useEffect, useState } from "react";
import { FaTimes, FaStar, FaTag, FaCalendar, FaDownload, FaChevronLeft, FaChevronRight, FaGithub } from "react-icons/fa";
import Spinner from "./Spinner";
import * as backend from "../../wailsjs/go/app/App";
import { getJsDelivrUrl } from "../utils/github";

export interface InfoData {
  title: string;
  description?: string;
  imageURL?: string;
  previews?: string[];
  repoURL?: string;
  authors?: { name: string; url?: string }[];
  tags?: string[];
  stars?: number;
  lastUpdated?: string;
  installed?: boolean;
  extensionURL?: string;
  resolvedImageSrc?: string;
}

interface InfoModalProps {
  info: InfoData;
  onClose: () => void;
  onInstall?: () => void;
  isInstalling?: boolean;
}

function getGitHubUsername(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/^https?:\/\/github\.com\/([^/]+)\/?$/);
  return m ? m[1] : null;
}

function AuthorAvatar({ url, name }: { url?: string; name: string }) {
  const username = getGitHubUsername(url);
  const [failed, setFailed] = useState(false);

  if (username && !failed) {
    return (
      <img
        src={`https://github.com/${username}.png?size=32`}
        alt={name}
        className="h-5 w-5 rounded-full object-cover"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2a2e34] text-[9px] font-bold text-[#a0a0a0] uppercase">
      {name[0]}
    </div>
  );
}

export default function AddonInfoModal({ info, onClose, onInstall, isInstalling }: InfoModalProps) {
  // Build the raw deduplicated slide list (URL strings only, no validation yet)
  const buildRawSlides = () => {
    const raw = info.previews && info.previews.length > 0
      ? info.previews
      : [info.imageURL || info.resolvedImageSrc].filter(Boolean) as string[];

    const seen = new Set<string>();
    return raw.map((p) => getJsDelivrUrl(p)).filter((u) => {
      if (!u || seen.has(u)) return false;
      seen.add(u);
      return true;
    });
  };

  // validSlides: null = still probing, [] = nothing loaded, [url,...] = confirmed good images
  const [validSlides, setValidSlides] = useState<string[] | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const raw = buildRawSlides();
    setCurrentSlide(0);

    if (raw.length === 0) {
      setValidSlides([]);
      return;
    }

    // Show first image immediately (optimistic), probe the rest in the background
    setValidSlides(raw.slice(0, 1));

    if (raw.length === 1) return; // nothing more to probe

    let confirmed: string[] = [raw[0]];
    let pending = raw.length - 1;

    raw.slice(1).forEach((url) => {
      const img = new window.Image();
      img.onload = () => {
        confirmed = [...confirmed, url];
        pending--;
        if (pending === 0) setValidSlides(confirmed);
      };
      img.onerror = () => {
        pending--;
        if (pending === 0) setValidSlides(confirmed);
      };
      img.src = url;
    });
  }, [info]);

  const slides = validSlides ?? [];
  const slideCount = slides.length;
  const idx = Math.min(currentSlide, Math.max(0, slideCount - 1));
  const imgSrc = slides[idx];
  const hasImage = !!imgSrc && /\.(png|jpg|jpeg|gif|webp|svg)/i.test(imgSrc);
  // Only show nav once probing is done (validSlides !== null) and there's genuinely >1 slide
  const showNav = validSlides !== null && slideCount > 1;

  const prevSlide = () => setCurrentSlide((i) => Math.max(0, i - 1));
  const nextSlide = () => setCurrentSlide((i) => Math.min(slideCount - 1, i + 1));

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#121418] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image / slideshow header */}
        <div className="relative h-48 w-full flex-shrink-0 overflow-hidden">
          {hasImage ? (
            <>
              <div className="absolute inset-0 scale-125 bg-cover bg-center blur-2xl" style={{ backgroundImage: `url(${imgSrc})` }} />
              <div className="absolute inset-0 bg-black/40" />
              <img src={imgSrc} className="relative z-0 h-full w-full object-contain" alt="" />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1e2228] to-[#121418]">
              <img src="/spicetifyx-logo.png" alt="SpicetifyX" className="h-20 w-20 opacity-40" />
            </div>
          )}

          {/* Prev / Next arrows — only shown after probing confirms >1 real image */}
          {showNav && (
            <>
              {idx > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                  className="absolute left-2 top-1/2 z-10 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                >
                  <FaChevronLeft className="h-3 w-3" />
                </button>
              )}
              {idx < slideCount - 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                  className="absolute right-10 top-1/2 z-10 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                >
                  <FaChevronRight className="h-3 w-3" />
                </button>
              )}

              {/* Dots */}
              <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setCurrentSlide(i); }}
                    className={`h-1.5 rounded-full transition-all ${i === idx ? "w-4 bg-white" : "w-1.5 bg-white/40"}`}
                  />
                ))}
              </div>
            </>
          )}

          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
          >
            <FaTimes className="h-4 w-4" />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto p-5">
          <h2 className="mb-1 text-xl font-bold text-white">{info.title}</h2>
          {info.description && <p className="mb-4 text-sm leading-relaxed text-[#a0a0a0]">{info.description}</p>}

          <div className="flex flex-col gap-2">
            {/* Authors with avatars */}
            {info.authors && info.authors.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                {info.authors.map((a, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <AuthorAvatar url={a.url} name={a.name} />
                    {a.url ? (
                      <button
                        className="text-sm text-[#d63c6a] hover:underline"
                        onClick={() => backend.OpenExternalLink(a.url!)}
                      >
                        {a.name}
                      </button>
                    ) : (
                      <span className="text-sm text-[#a0a0a0]">{a.name}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Repo link */}
            {info.repoURL && (
              <button
                className="flex items-center gap-2 text-sm text-[#a0a0a0] hover:text-white transition-colors w-fit"
                onClick={() => backend.OpenExternalLink(info.repoURL!)}
              >
                <FaGithub className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{info.repoURL.replace("https://github.com/", "")}</span>
              </button>
            )}

            {info.stars !== undefined && (
              <div className="flex items-center gap-2 text-sm text-[#a0a0a0]">
                <FaStar className="h-3 w-3 flex-shrink-0 text-yellow-400" />
                <span>{info.stars} stars</span>
              </div>
            )}

            {info.tags && info.tags.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-[#a0a0a0]">
                <FaTag className="h-3 w-3 flex-shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {info.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-[#2a2e34] px-2 py-0.5 text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {info.lastUpdated && (
              <div className="flex items-center gap-2 text-sm text-[#a0a0a0]">
                <FaCalendar className="h-3 w-3 flex-shrink-0" />
                <span>Updated {new Date(info.lastUpdated).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {onInstall && !info.installed && (
          <div className="flex-shrink-0 border-t border-[#2a2a2a] p-4">
            <button
              onClick={onInstall}
              disabled={isInstalling}
              className="flex w-full items-center justify-center gap-2 rounded bg-[#d63c6a] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#c52c5a] disabled:opacity-50"
            >
              {isInstalling ? <Spinner className="h-4 w-4" /> : <FaDownload className="h-4 w-4" />}
              {isInstalling ? "Installing..." : "Install"}
            </button>
          </div>
        )}

        {info.installed && (
          <div className="flex-shrink-0 border-t border-[#2a2a2a] p-4">
            <div className="flex w-full items-center justify-center gap-2 rounded bg-[#2a2e34] px-4 py-2.5 text-sm font-semibold text-[#d63c6a]">
              Already installed
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
