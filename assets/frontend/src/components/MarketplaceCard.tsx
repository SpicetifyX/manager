import { FaDownload, FaInfoCircle } from "react-icons/fa";
import { CardItem } from "../utils/marketplace-types";
import Spinner from "./Spinner";

interface Props {
  item: CardItem;
  isInstalling: boolean;
  onInstall: () => void;
  onInfo: () => void;
  containerRef?: (node: HTMLDivElement | null) => void;
}

export default function MarketplaceCard({ item, isInstalling, onInstall, onInfo, containerRef }: Props) {
  const hasImage = item.imageURL && /\.(png|jpg|jpeg|gif|webp|svg)/i.test(item.imageURL);

  return (
    <div
      ref={containerRef}
      className={`group relative flex h-64 max-h-64 w-full flex-col overflow-hidden rounded-lg border ${item.installed ? "border-[#d63c6a]" : "border-[#2a2a2a]"
        } bg-[#121418] transition`}
    >
      {hasImage ? (
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-t-lg">
          <div className="absolute inset-0 scale-125 rounded-t-lg bg-cover bg-center blur-2xl" style={{ backgroundImage: `url(${item.imageURL})` }} />
          <div className="absolute inset-0 rounded-t-lg bg-black/40" />
          <img
            src={item.imageURL}
            className="relative z-0 h-full w-full rounded-lg object-contain"
            alt=""
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-t-lg bg-gradient-to-br from-[#1e2228] to-[#121418]">
          <img src="/spicetifyx-logo.png" alt="" className="h-12 w-12 opacity-30" />
        </div>
      )}

      {item.curated && !item.installed && (
        <div className="absolute top-2 left-2 z-[97]">
          <div className="flex h-6 items-center gap-1 rounded-full border border-[#d63c6a]/30 bg-[#d63c6a]/15 px-2 text-xs font-semibold text-[#d63c6a]">
            ✦ Curated
          </div>
        </div>
      )}
      {item.installed ? (
        <div className="absolute top-2 right-2">
          <div className="z-[96] flex h-8 items-center rounded-full border border-[#1a1a1a] bg-[#d63c6a] p-3 text-sm font-semibold">Installed</div>
        </div>
      ) : (
        <div className="absolute hidden h-full w-full rounded-t-lg bg-gradient-to-b from-black/75 to-black/5 transition-all duration-200 group-hover:block">
          <div className="flex w-full items-center justify-end gap-1 pt-2 pr-2">
            <button
              onClick={onInfo}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1a1a1a] bg-gray-500 p-1 transition-colors hover:bg-gray-400"
              title="Info"
            >
              <FaInfoCircle />
            </button>
            <button
              onClick={onInstall}
              disabled={isInstalling}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1a1a1a] bg-[#d63c6a] p-1 transition-colors hover:bg-[#c52c5a] disabled:opacity-50"
              title="Install"
            >
              {isInstalling ? <Spinner className="h-4 w-4" /> : <FaDownload />}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col space-y-1 p-3 text-sm text-zinc-300">
        <span className="text-md font-semibold text-white">{item.title}</span>
        <span className="truncate text-sm text-gray-300">{item.subtitle}</span>
      </div>
    </div>
  );
}
