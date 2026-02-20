import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { AddonInfo } from "../types/addon.d";
import Addon from "./Addon";
import { FaChevronLeft, FaDownload, FaInfoCircle, FaSearch, FaTimes } from "react-icons/fa";
import { fetchExtensionManifest, getTaggedRepos } from "../utils/fetchRemotes";
import { CardItem } from "../utils/marketplace-types";
import Spinner from "./Spinner";
import AddonInfoModal, { AddonInfoData } from "./AddonInfoModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import * as backend from "../../wailsjs/go/app/App";

export default function MarketplaceAddons({
  onDirtyChange,
  resetKey,
  snapshotKey,
}: {
  onDirtyChange: (dirty: boolean) => void;
  resetKey: number;
  snapshotKey: number;
}) {
  const [addons, setAddons] = useState<AddonInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [browsingContent, setBrowsingContent] = useState(false);
  const [communityExtensions, setCommunityExtensions] = useState<CardItem[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityError, setCommunityError] = useState<string | null>(null);
  const [installingIndex, setInstallingIndex] = useState<number | null>(null);
  const [infoIndex, setInfoIndex] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const addonsRef = useRef<AddonInfo[]>([]);
  const captureBaselineRef = useRef(true);
  const baselineRef = useRef<Map<string, boolean> | null>(null);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const fetchCommunityExtensions = async (loadMore = false) => {
    const targetPage = loadMore ? page + 1 : 1;
    if (targetPage === 1) {
      setCommunityLoading(true);
      setCommunityExtensions([]);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }
    setCommunityError(null);

    try {
      const pageOfRepos = await getTaggedRepos("spicetify-extensions", targetPage, [], false);

      const results = await Promise.allSettled(
        pageOfRepos.items.map((repo: any) =>
          fetchExtensionManifest(repo.contents_url, repo.default_branch, repo.stargazers_count).then(
            (exts) =>
              exts?.map((ext) => ({
                ...ext,
                archived: repo.archived,
                lastUpdated: repo.pushed_at,
                created: repo.created_at,
              })) || [],
          ),
        ),
      );
      const extensions: CardItem[] = [];
      const currentAddons = addonsRef.current;
      for (const result of results) {
        if (result.status === "fulfilled" && result.value.length) {
          extensions.push(
            ...result.value.map((ext: any) => ({
              ...ext,
              installed: currentAddons.some((a) => a.name === ext.title),
            })),
          );
        }
      }
      setCommunityExtensions((prev) => (targetPage === 1 ? extensions : [...prev, ...extensions]));
      setPage(targetPage);
      if (pageOfRepos.items.length === 0 || pageOfRepos.items.length < 30) {
        setHasMore(false);
      }
    } catch (err: any) {
      console.error("Failed to fetch community extensions:", err);
      setCommunityError(err.message?.includes("403") ? "GitHub API rate limit reached. Try again later." : "Failed to load community extensions.");
    } finally {
      if (targetPage === 1) {
        setCommunityLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  const fetchAddons = async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const fetchedAddons = await backend.GetInstalledExtensions();
      setAddons(fetchedAddons);
      addonsRef.current = fetchedAddons;
      if (captureBaselineRef.current) {
        baselineRef.current = new Map(fetchedAddons.map((a) => [a.addonFileName, a.isEnabled]));
        captureBaselineRef.current = false;
        onDirtyChange(false);
      } else if (baselineRef.current) {
        const bl = baselineRef.current;
        const isDirty =
          fetchedAddons.some((a) => {
            const base = bl.get(a.addonFileName);
            return base === undefined || base !== a.isEnabled;
          }) || [...bl.keys()].some((k) => !fetchedAddons.find((a) => a.addonFileName === k));
        onDirtyChange(isDirty);
      }
    } catch (err: any) {
      if (!silent) setError(err.message || "Failed to fetch addons.");
      console.error("Error fetching addons:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddons();
  }, []);

  useEffect(() => {
    if (browsingContent) {
      fetchCommunityExtensions();
    }
  }, [browsingContent]);

  useEffect(() => {
    if (communityExtensions.length > 0) {
      setCommunityExtensions((prev) =>
        prev.map((ce) => ({
          ...ce,
          installed: addons.some((a) => a.name === ce.title),
        })),
      );
    }
  }, [addons]);

  // Recapture baseline after Apply
  useEffect(() => {
    if (snapshotKey === 0) return;
    captureBaselineRef.current = true;
    fetchAddons(true);
  }, [snapshotKey]);

  // Undo toggle changes on Reset
  useEffect(() => {
    if (resetKey === 0 || !baselineRef.current) return;
    const baseline = new Map(baselineRef.current);
    (async () => {
      try {
        const current = await backend.GetInstalledExtensions();
        for (const addon of current) {
          const baselineEnabled = baseline.get(addon.addonFileName);
          if (baselineEnabled !== undefined && addon.isEnabled !== baselineEnabled) {
            await backend.ToggleSpicetifyExtension(addon.addonFileName, baselineEnabled);
          }
        }
        await fetchAddons(true);
      } catch (err) {
        console.error("[MarketplaceAddons] Reset failed:", err);
      }
    })();
  }, [resetKey]);

  const handleToggleAddon = async (addonFileName: string, enable: boolean) => {
    setTogglingId(addonFileName);
    setAddons((prevAddons) => prevAddons.map((addon) => (addon.addonFileName === addonFileName ? { ...addon, isEnabled: enable } : addon)));

    try {
      const success = await backend.ToggleSpicetifyExtension(addonFileName, enable);
      if (!success) {
        setAddons((prevAddons) => prevAddons.map((addon) => (addon.addonFileName === addonFileName ? { ...addon, isEnabled: !enable } : addon)));
        alert(`Failed to toggle addon: ${addonFileName}`);
      }
      fetchAddons(true);
    } catch (err: any) {
      console.error(`Error toggling addon ${addonFileName}:`, err);
      setAddons((prevAddons) => prevAddons.map((addon) => (addon.addonFileName === addonFileName ? { ...addon, isEnabled: !enable } : addon)));
      alert(`Error toggling addon: ${err.message}`);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteAddon = (addonFileName: string) => {
    const addonName = addons.find((a) => a.addonFileName === addonFileName)?.name || addonFileName;
    setPendingDelete({ id: addonFileName, name: addonName });
  };

  const confirmDeleteAddon = async () => {
    if (!pendingDelete) return;
    const { id: addonFileName } = pendingDelete;
    setPendingDelete(null);
    setTogglingId(addonFileName);
    try {
      const success = await backend.DeleteSpicetifyExtension(addonFileName);
      if (!success) {
        alert(`Failed to delete extension: ${addonFileName}`);
      }
      fetchAddons(true);
    } catch (err: any) {
      console.error(`Error deleting extension ${addonFileName}:`, err);
      alert(`Error deleting extension: ${err.message}`);
    } finally {
      setTogglingId(null);
    }
  };

  const handleInstallExtension = async (ext: CardItem, index: number) => {
    if (!ext.extensionURL || ext.installed) return;
    setInstallingIndex(index);
    setInfoIndex(null);
    try {
      const urlParts = ext.extensionURL.split("/");
      const filename = urlParts[urlParts.length - 1];
      const meta = {
        name: ext.title,
        description: ext.subtitle,
        imageURL: ext.imageURL,
        authors: ext.authors,
        tags: ext.tags,
        stars: ext.stargazers_count,
      };
      const success = await backend.InstallMarketplaceExtension(ext.extensionURL, filename, meta as any);
      if (success) {
        setCommunityExtensions((prev) => prev.map((e, i) => (i === index ? { ...e, installed: true } : e)));
        fetchAddons(true);
      } else {
        alert(`Failed to install ${ext.title}`);
      }
    } catch (err: any) {
      alert(`Error installing ${ext.title}: ${err.message}`);
    } finally {
      setInstallingIndex(null);
    }
  };

  const sortTags = ["Popular", "Newest", "Recently Updated"] as const;
  const contentTags = ["Lyrics", "UI", "Utility", "Playback", "Official"] as const;
  const smartTags = [...sortTags, ...contentTags];

  const filteredExtensions = useMemo(() => {
    let result = communityExtensions.map((ext, idx) => ({ ext, origIdx: idx }));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        ({ ext }) =>
          ext.title?.toLowerCase().includes(q) ||
          ext.subtitle?.toLowerCase().includes(q) ||
          ext.user?.toLowerCase().includes(q) ||
          ext.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }
    const activeContentTags = selectedTags.filter((t) => (contentTags as readonly string[]).includes(t));
    if (activeContentTags.length > 0) {
      result = result.filter(
        ({ ext }) => Array.isArray(ext.tags) && activeContentTags.every((tag) => ext.tags.some((tt) => tt.toLowerCase() === tag.toLowerCase())),
      );
    }
    if (selectedTags.includes("Popular")) {
      result.sort((a, b) => (b.ext.stargazers_count || 0) - (a.ext.stargazers_count || 0));
    } else if (selectedTags.includes("Newest")) {
      result.sort((a, b) => new Date(b.ext.created || 0).getTime() - new Date(a.ext.created || 0).getTime());
    } else if (selectedTags.includes("Recently Updated")) {
      result.sort((a, b) => new Date(b.ext.lastUpdated || 0).getTime() - new Date(a.ext.lastUpdated || 0).getTime());
    }
    return result;
  }, [communityExtensions, searchQuery, selectedTags]);

  const observer = useRef<IntersectionObserver>();
  const lastAddonElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (communityLoading || loadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchCommunityExtensions(true);
        }
      });
      if (node) observer.current.observe(node);
    },
    [communityLoading, loadingMore, hasMore],
  );

  return browsingContent ? (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex w-full flex-shrink-0 flex-col border-b border-[#2a2a2a] bg-[#121418] select-none">
        <div className="flex h-12 items-center justify-between pl-1 pr-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setBrowsingContent(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#a0a0a0] transition-colors hover:bg-[#2a2a2a] hover:text-white"
              title="Back"
            >
              <FaChevronLeft />
            </button>
            <span className="text-gray-300">Browsing Community Extensions</span>
          </div>
          <div className="relative">
            <FaSearch className="pointer-events-none absolute top-1/2 left-2.5 h-3 w-3 -translate-y-1/2 text-[#666]" />
            <input
              type="text"
              placeholder="Search extensions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-72 rounded-full border border-[#2a2a2a] bg-[#1a1a1a] pl-8 pr-3 text-sm text-white placeholder-[#666] outline-none transition-colors focus:border-[#d63c6a]"
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 pb-2">
          {smartTags.map((tag) => {
            const isSortTag = (sortTags as readonly string[]).includes(tag);
            return (
              <button
                key={tag}
                onClick={() =>
                  setSelectedTags((prev) => {
                    if (prev.includes(tag)) return prev.filter((t) => t !== tag);
                    if (isSortTag) return [...prev.filter((t) => !(sortTags as readonly string[]).includes(t)), tag];
                    return [...prev, tag];
                  })
                }
                className={`flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${selectedTags.includes(tag) ? "bg-[#d63c6a] text-white" : "bg-[#1e2228] text-[#a0a0a0] hover:bg-[#2a2e34] hover:text-white"
                  }`}
              >
                {tag}
                {selectedTags.includes(tag) && <FaTimes className="h-2.5 w-2.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {communityError ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <span className="text-lg text-red-400">{communityError}</span>
            <button
              onClick={() => fetchCommunityExtensions()}
              className="rounded-full bg-[#d63c6a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c52c5a]"
            >
              Retry
            </button>
          </div>
        </div>
      ) : communityLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center space-y-6">
            <Spinner className="h-16 w-16" />
            <span className="text-lg text-gray-100">Fetching Extensions</span>
          </div>
        </div>
      ) : communityExtensions.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <span className="text-lg text-[#a0a0a0]">No community extensions found.</span>
        </div>
      ) : (
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-6 text-white">
          <div className="grid w-full grid-cols-3 gap-4">
            {filteredExtensions.map(({ ext, origIdx }, i) => {
              const hasImage = ext.imageURL && /\.(png|jpg|jpeg|gif|webp|svg)/i.test(ext.imageURL);
              const isInstalling = installingIndex === origIdx;

              return (
                <div
                  ref={i === filteredExtensions.length - 1 ? lastAddonElementRef : null}
                  key={`${ext.user}/${ext.repo}/${ext.title}`}
                  className={`group relative flex h-64 max-h-64 w-full flex-col rounded-lg border ${ext.installed ? "border-[#d63c6a]" : "border-[#2a2a2a]"} bg-[#121418] transition`}
                >
                  {hasImage ? (
                    <div className="relative aspect-square w-full overflow-hidden rounded-t-lg">
                      <div
                        className="absolute inset-0 scale-125 rounded-t-lg bg-cover bg-center blur-2xl"
                        style={{ backgroundImage: `url(${ext.imageURL})` }}
                      />
                      <div className="absolute inset-0 rounded-t-lg bg-black/40" />
                      <img
                        src={ext.imageURL}
                        className="relative z-0 h-full w-full rounded-lg object-contain"
                        alt=""
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center rounded-t-lg bg-gradient-to-br from-[#1e2228] to-[#121418]">
                      <img src="/spicetifyx-logo.png" alt="" className="h-12 w-12 opacity-30" />
                    </div>
                  )}

                  {ext.installed ? (
                    <div className="absolute top-2 right-2">
                      <div className="z-[96] flex h-8 items-center rounded-full border border-[#1a1a1a] bg-[#d63c6a] p-3 text-sm font-semibold">
                        Installed
                      </div>
                    </div>
                  ) : (
                    <div className="absolute hidden h-full w-full rounded-t-lg bg-gradient-to-b from-black/75 to-black/5 transition-all duration-200 group-hover:block">
                      <div className="flex w-full items-center justify-end gap-1 pt-2 pr-2">
                        <button
                          onClick={() => setInfoIndex(origIdx)}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1a1a1a] bg-gray-500 p-1 hover:bg-gray-400 transition-colors"
                          title="Info"
                        >
                          <FaInfoCircle />
                        </button>
                        <button
                          onClick={() => handleInstallExtension(ext, origIdx)}
                          disabled={isInstalling}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1a1a1a] bg-[#d63c6a] p-1 hover:bg-[#c52c5a] transition-colors disabled:opacity-50"
                          title="Install"
                        >
                          {isInstalling ? <Spinner className="h-4 w-4" /> : <FaDownload />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col space-y-1 p-3 text-sm text-zinc-300">
                    <span className="text-md font-semibold text-white">{ext.title}</span>
                    <span className="truncate text-sm text-gray-300">{ext.subtitle}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {loadingMore && (
            <div className="mt-4 flex justify-center">
              <Spinner />
            </div>
          )}
        </div>
      )}

      {infoIndex !== null &&
        communityExtensions[infoIndex] &&
        (() => {
          const ext = communityExtensions[infoIndex];
          const infoData: AddonInfoData = {
            title: ext.title,
            description: ext.subtitle || ext.description,
            imageURL: ext.imageURL,
            authors: ext.authors,
            tags: ext.tags,
            stars: ext.stargazers_count,
            lastUpdated: ext.lastUpdated,
            installed: ext.installed,
            extensionURL: ext.extensionURL,
          };
          return (
            <AddonInfoModal
              info={infoData}
              onClose={() => setInfoIndex(null)}
              onInstall={() => handleInstallExtension(ext, infoIndex)}
              isInstalling={installingIndex === infoIndex}
            />
          );
        })()}
    </div>
  ) : (
    <>
      <div className="flex h-full flex-col p-4">
        <div className="mb-6 flex w-full items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Installed Addons</h1>
            <p className="text-[#a0a0a0]">Manage your Spicetify extensions.</p>
          </div>
          <button
            onClick={() => setBrowsingContent(true)}
            className="flex h-8 w-fit items-center gap-2 rounded-full bg-[#d63c6a] px-4 py-2 text-sm font-semibold whitespace-nowrap text-white transition-all duration-200 hover:bg-[#c52c5a] active:bg-[#b51c4a]"
          >
            Browse content
            <FaDownload />
          </button>
        </div>

        {loading && <p className="text-[#a0a0a0]">Loading addons...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}

        {!loading && !error && (
          <div className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
            {addons.length > 0 ? (
              addons.map((addon) => (
                <Addon
                  key={addon.id}
                  name={addon.name}
                  description={addon.description}
                  isEnabled={addon.isEnabled}
                  onToggle={handleToggleAddon}
                  onDelete={handleDeleteAddon}
                  preview={addon.preview ? addon.preview : undefined}
                  isToggling={togglingId === addon.addonFileName}
                  addonFileName={addon.addonFileName}
                  authors={addon.authors}
                  tags={addon.tags}
                />
              ))
            ) : (
              <p className="text-[#a0a0a0]">No addons found.</p>
            )}
          </div>
        )}
      </div>
      <ConfirmDeleteModal
        show={!!pendingDelete}
        itemName={pendingDelete?.name || ""}
        itemType="extension"
        onConfirm={confirmDeleteAddon}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
