import React from "react";
import { FaChevronLeft, FaSearch, FaCheck, FaTimes, FaDownload } from "react-icons/fa";
import { CardItem } from "../utils/marketplace-types";
import Spinner from "./Spinner";
import CommunityExtensionCard from "./CommunityExtensionCard";

interface CommunityExtensionsProps {
  setBrowsingContent: (browsing: boolean) => void;
  filteredExtensions: CardItem[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterStatus: "all" | "installed" | "not-installed";
  setFilterStatus: (status: "all" | "installed" | "not-installed") => void;
  sortBy: "popular" | "recent" | "name";
  setSortBy: (sort: "popular" | "recent" | "name") => void;
  communityExtensions: CardItem[];
  error: string | null;
  fetchCommunityExtensions: (append?: boolean) => void;
  formatDate: (date: string) => string;
  handleInfoClick: (ext: CardItem) => void;
  handleDownloadClick: (ext: CardItem) => void;
  hasMore: boolean;
  handleLoadMore: () => void;
  loadingMore: boolean;
}

const CommunityExtensions: React.FC<CommunityExtensionsProps> = ({
  setBrowsingContent,
  filteredExtensions,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  sortBy,
  setSortBy,
  communityExtensions,
  error,
  fetchCommunityExtensions,
  formatDate,
  handleInfoClick,
  handleDownloadClick,
  hasMore,
  handleLoadMore,
  loadingMore,
}) => {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#171b20]">
      {/* Header with Back Button */}
      <div className="flex h-14 w-full flex-shrink-0 items-center justify-between border-b border-[#2a2a2a] bg-[#121418] px-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setBrowsingContent(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#a0a0a0] transition-all hover:bg-[#2a2a2a] hover:text-white"
            title="Back to Installed"
          >
            <FaChevronLeft />
          </button>
          <div>
            <h2 className="text-sm font-semibold text-white">Community Extensions</h2>
            <p className="text-xs text-[#a0a0a0]">
              {filteredExtensions.length} extension{filteredExtensions.length !== 1 ? "s" : ""}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>
        </div>
      </div>

      {communityExtensions.length === 0 && !error ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Spinner className="h-12 w-12" />
            <span className="text-sm text-[#a0a0a0]">Loading extensions...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Search, Filter, Sort Bar */}
          <div className="flex flex-col gap-3 border-b border-[#2a2a2a] bg-[#121418] p-5">
            <div className="relative">
              <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-[#a0a0a0]" />
              <input
                type="text"
                placeholder="Search extensions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#0c0e11] py-2 pr-4 pl-10 text-sm text-white placeholder-[#a0a0a0] transition-colors focus:border-[#d63c6a] focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    filterStatus === "all" ? "bg-[#d63c6a] text-white" : "bg-[#2a2a2a] text-[#a0a0a0] hover:bg-[#3a3a3a] hover:text-white"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus("installed")}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    filterStatus === "installed" ? "bg-[#d63c6a] text-white" : "bg-[#2a2a2a] text-[#a0a0a0] hover:bg-[#3a3a3a] hover:text-white"
                  }`}
                >
                  <FaCheck className="h-2.5 w-2.5" />
                  Installed
                </button>
                <button
                  onClick={() => setFilterStatus("not-installed")}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    filterStatus === "not-installed"
                      ? "bg-[#d63c6a] text-white"
                      : "bg-[#2a2a2a] text-[#a0a0a0] hover:bg-[#3a3a3a] hover:text-white"
                  }`}
                >
                  Not Installed
                </button>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-lg border border-[#2a2a2a] bg-[#0c0e11] px-3 py-1.5 text-xs text-white transition-colors focus:border-[#d63c6a] focus:outline-none"
              >
                <option value="popular">Most Popular</option>
                <option value="recent">Recently Updated</option>
                <option value="name">A-Z</option>
              </select>
            </div>
          </div>

          {/* Extensions Grid */}
          {error ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex flex-col items-center space-y-3 text-center">
                <FaTimes className="h-12 w-12 text-red-500" />
                <span className="text-sm text-white">Failed to load extensions</span>
                <span className="text-xs text-[#a0a0a0]">{error}</span>
                <button
                  onClick={() => fetchCommunityExtensions(false)}
                  className="mt-2 rounded-lg bg-[#d63c6a] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#c52c5a]"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : filteredExtensions.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex flex-col items-center space-y-3 text-center">
                <FaSearch className="h-12 w-12 text-[#a0a0a0]" />
                <span className="text-sm text-white">No extensions found</span>
                <span className="text-xs text-[#a0a0a0]">Try adjusting your search or filters</span>
              </div>
            </div>
          ) : (
            <div className="custom-scrollbar flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-3 gap-4">
                {filteredExtensions.map((ext, index) => (
                  <CommunityExtensionCard
                    key={`${ext.title}-${index}`}
                    ext={ext}
                    formatDate={formatDate}
                    onInfoClick={handleInfoClick}
                    onDownloadClick={handleDownloadClick}
                  />
                ))}
              </div>

              {hasMore && filteredExtensions.length > 0 && filterStatus === "all" && !searchQuery && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 rounded-lg bg-[#2a2a2a] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#3a3a3a] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <>
                        <Spinner className="h-4 w-4" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <FaDownload />
                        Load More
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CommunityExtensions;
