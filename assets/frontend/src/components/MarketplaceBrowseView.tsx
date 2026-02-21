import { FaChevronLeft, FaSearch, FaTimes } from "react-icons/fa";
import { CardItem } from "../utils/marketplace-types";
import { AddonInfoData } from "./AddonInfoModal";
import AddonInfoModal from "./AddonInfoModal";
import MarketplaceCard from "./MarketplaceCard";
import Spinner from "./Spinner";
import ErrorState from "./ui/ErrorState";
import LoadingState from "./ui/LoadingState";
import EmptyState from "./ui/EmptyState";

export interface BrowseItem {
  item: CardItem;
  origIdx: number;
}

interface Props {
  // Header
  title: string;
  searchPlaceholder: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onBack: () => void;
  // Tags
  allTags: readonly string[];
  sortTags: readonly string[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  // Content state
  error: string | null;
  onRetry: () => void;
  loading: boolean;
  loadingLabel: string;
  emptyLabel: string;
  // Grid
  items: BrowseItem[];
  allItems: CardItem[];
  installingIndex: number | null;
  onInstall: (item: CardItem, origIdx: number) => void;
  loadingMore: boolean;
  lastItemRef: (node: HTMLDivElement | null) => void;
  // Info modal
  infoIndex: number | null;
  onInfo: (origIdx: number) => void;
  onInfoClose: () => void;
}

export default function MarketplaceBrowseView({
  title,
  searchPlaceholder,
  searchQuery,
  onSearchChange,
  onBack,
  allTags,
  sortTags,
  selectedTags,
  onTagsChange,
  error,
  onRetry,
  loading,
  loadingLabel,
  emptyLabel,
  items,
  allItems,
  installingIndex,
  onInstall,
  loadingMore,
  lastItemRef,
  infoIndex,
  onInfo,
  onInfoClose,
}: Props) {
  const handleTagClick = (tag: string) => {
    const isSortTag = (sortTags as readonly string[]).includes(tag);
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else if (isSortTag) {
      onTagsChange([...selectedTags.filter((t) => !(sortTags as readonly string[]).includes(t)), tag]);
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const infoItem = infoIndex !== null ? allItems[infoIndex] : null;
  const infoData: AddonInfoData | null = infoItem
    ? {
        title: infoItem.title,
        description: infoItem.subtitle || infoItem.description,
        imageURL: infoItem.imageURL,
        authors: infoItem.authors,
        tags: infoItem.tags,
        stars: infoItem.stargazers_count,
        lastUpdated: infoItem.lastUpdated,
        installed: infoItem.installed,
        extensionURL: infoItem.extensionURL,
      }
    : null;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Sticky header */}
      <div className="flex w-full flex-shrink-0 flex-col border-b border-[#2a2a2a] bg-[#121418] select-none">
        <div className="flex h-12 items-center justify-between pl-1 pr-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#a0a0a0] transition-colors hover:bg-[#2a2a2a] hover:text-white"
              title="Back"
            >
              <FaChevronLeft />
            </button>
            <span className="text-gray-300">{title}</span>
          </div>
          <div className="relative">
            <FaSearch className="pointer-events-none absolute top-1/2 left-2.5 h-3 w-3 -translate-y-1/2 text-[#666]" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-8 w-72 rounded-full border border-[#2a2a2a] bg-[#1a1a1a] pl-8 pr-3 text-sm text-white placeholder-[#666] outline-none transition-colors focus:border-[#d63c6a]"
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 pb-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedTags.includes(tag) ? "bg-[#d63c6a] text-white" : "bg-[#1e2228] text-[#a0a0a0] hover:bg-[#2a2e34] hover:text-white"
              }`}
            >
              {tag}
              {selectedTags.includes(tag) && <FaTimes className="h-2.5 w-2.5" />}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      {error ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : loading ? (
        <LoadingState label={loadingLabel} />
      ) : allItems.length === 0 ? (
        <EmptyState label={emptyLabel} />
      ) : items.length === 0 ? (
        <EmptyState label="No results match your search." />
      ) : (
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-6 text-white">
          <div className="grid w-full grid-cols-3 gap-4">
            {items.map(({ item, origIdx }, i) => (
              <MarketplaceCard
                key={`${item.user}/${item.repo}/${item.title}`}
                item={item}
                isInstalling={installingIndex === origIdx}
                onInstall={() => onInstall(item, origIdx)}
                onInfo={() => onInfo(origIdx)}
                containerRef={i === items.length - 1 ? lastItemRef : undefined}
              />
            ))}
          </div>
          {loadingMore && (
            <div className="mt-4 flex justify-center">
              <Spinner />
            </div>
          )}
        </div>
      )}

      {/* Info modal */}
      {infoData && infoItem && (
        <AddonInfoModal
          info={infoData}
          onClose={onInfoClose}
          onInstall={() => onInstall(infoItem, infoIndex!)}
          isInstalling={installingIndex === infoIndex}
        />
      )}
    </div>
  );
}
