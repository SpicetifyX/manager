import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { AddonInfo } from "../types/addon.d";
import Addon from "./Addon";
import { FaDownload, FaExclamationTriangle } from "react-icons/fa";
import { fetchExtensionManifest, getTaggedRepos } from "../utils/fetchRemotes";
import { CardItem } from "../utils/marketplace-types";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import * as backend from "../../wailsjs/go/app/App";
import { useSpicetify } from "../context/SpicetifyContext";
import MarketplaceBrowseView from "./MarketplaceBrowseView";

export default function MarketplaceAddons({
  onDirtyChange,
  resetKey,
  snapshotKey,
}: {
  onDirtyChange: (dirty: boolean) => void;
  resetKey: number;
  snapshotKey: number;
}) {
  const { extensions, extensionsLoaded, setExtensionsLocally, refreshExtensions, baselineExtensions } = useSpicetify();

  const [loading, setLoading] = useState(!extensionsLoaded);
  const [error, setError] = useState<string | null>(null);
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
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [installError, setInstallError] = useState<string | null>(null);

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
      const extensionsList: CardItem[] = [];
      for (const result of results) {
        if (result.status === "fulfilled" && result.value.length) {
          extensionsList.push(
            ...result.value.map((ext: any) => ({
              ...ext,
              installed: extensions.some((a) => a.name === ext.title),
            })),
          );
        }
      }

      if (targetPage === 1) {
        setCommunityExtensions([...extensionsList]);
      } else {
        setCommunityExtensions((prev) => [...prev, ...extensionsList]);
      }
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
      await refreshExtensions();
    } catch (err: any) {
      if (!silent) setError(err.message || "Failed to fetch addons.");
      console.error("Error fetching addons:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    const isDirty =
      extensions.length !== baselineExtensions.length ||
      extensions.some((a) => {
        const base = baselineExtensions.find((b) => b.addonFileName === a.addonFileName);
        return base === undefined || base.isEnabled !== a.isEnabled;
      });
    onDirtyChange(isDirty);
  }, [extensions, baselineExtensions]);

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
          installed: extensions.some((a) => a.name === ce.title),
        })),
      );
    }
  }, [extensions]);

  const handleToggleAddon = (addonFileName: string, enable: boolean) => {
    const updated = extensions.map((addon) => (addon.addonFileName === addonFileName ? { ...addon, isEnabled: enable } : addon));
    setExtensionsLocally(updated);
  };

  const handleDeleteAddon = (addonFileName: string) => {
    const addonName = extensions.find((a) => a.addonFileName === addonFileName)?.name || addonFileName;
    setPendingDelete({ id: addonFileName, name: addonName });
  };

  const confirmDeleteAddon = async () => {
    if (!pendingDelete) return;
    const { id: addonFileName } = pendingDelete;
    setPendingDelete(null);
    const updated = extensions.filter((a) => a.addonFileName !== addonFileName);
    setExtensionsLocally(updated);
  };

  const handleInstallExtension = async (ext: CardItem, index: number) => {
    if (ext.installed) return;
    if (!ext.extensionURL) {
      setInstallError(`"${ext.title}" doesn't have a valid download URL in its manifest.`);
      return;
    }
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
      if (!success) {
        setInstallError(`Failed to install "${ext.title}". The file could not be downloaded or was invalid.`);
        return;
      }
      // Verify the file is actually recognised by the scanner after install
      const updated = await refreshExtensions(false);
      const wasFound = updated.some((e) => e.addonFileName === filename);
      if (wasFound) {
        setCommunityExtensions((prev) => prev.map((e, i) => (i === index ? { ...e, installed: true } : e)));
      } else {
        setInstallError(`"${ext.title}" was downloaded but couldn't be loaded. The file format may not be supported.`);
      }
    } catch (err: any) {
      setInstallError(`Failed to install "${ext.title}": ${err.message ?? "Unknown error"}`);
    } finally {
      setInstallingIndex(null);
    }
  };

  const sortTags = ["Popular", "Newest", "Recently Updated"] as const;
  const contentTags = ["Lyrics", "UI", "Utility", "Playback", "Official"] as const;
  const smartTags = [...sortTags, ...contentTags];

  const filteredExtensions = useMemo(() => {
    let result = communityExtensions.map((item, idx) => ({ item, origIdx: idx }));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        ({ item }) =>
          item.title?.toLowerCase().includes(q) ||
          item.subtitle?.toLowerCase().includes(q) ||
          item.user?.toLowerCase().includes(q) ||
          item.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }
    const activeContentTags = selectedTags.filter((t) => (contentTags as readonly string[]).includes(t));
    if (activeContentTags.length > 0) {
      result = result.filter(
        ({ item }) => Array.isArray(item.tags) && activeContentTags.every((tag) => item.tags.some((tt) => tt.toLowerCase() === tag.toLowerCase())),
      );
    }
    if (selectedTags.includes("Popular")) {
      result.sort((a, b) => (b.item.stargazers_count || 0) - (a.item.stargazers_count || 0));
    } else if (selectedTags.includes("Newest")) {
      result.sort((a, b) => new Date(b.item.created || 0).getTime() - new Date(a.item.created || 0).getTime());
    } else if (selectedTags.includes("Recently Updated")) {
      result.sort((a, b) => new Date(b.item.lastUpdated || 0).getTime() - new Date(a.item.lastUpdated || 0).getTime());
    }
    return result;
  }, [communityExtensions, searchQuery, selectedTags]);

  const observer = useRef<IntersectionObserver>();
  const lastAddonElementRef = useCallback(
    (node: HTMLDivElement | null) => {
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

  return (
    <>
      {browsingContent ? (
    <MarketplaceBrowseView
      title="Browsing Community Extensions"
      searchPlaceholder="Search extensions..."
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onBack={() => setBrowsingContent(false)}
      allTags={smartTags}
      sortTags={sortTags}
      selectedTags={selectedTags}
      onTagsChange={setSelectedTags}
      error={communityError}
      onRetry={fetchCommunityExtensions}
      loading={communityLoading}
      loadingLabel="Fetching Extensions"
      emptyLabel="No community extensions found."
      items={filteredExtensions}
      allItems={communityExtensions}
      installingIndex={installingIndex}
      onInstall={handleInstallExtension}
      loadingMore={loadingMore}
      lastItemRef={lastAddonElementRef}
      infoIndex={infoIndex}
      onInfo={setInfoIndex}
      onInfoClose={() => setInfoIndex(null)}
    />
  ) : (
    <>
      <div className="flex h-full flex-col p-4">
        <div className="mb-4 flex w-full items-center justify-between border-b border-[#2a2a2a] pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Installed Addons</h1>
            <p className="text-sm mt-1 text-[#a0a0a0]">Manage your Spicetify extensions.</p>
          </div>
          <button
            onClick={() => setBrowsingContent(true)}
            className="flex h-8 w-fit items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold whitespace-nowrap text-white transition-all duration-200 hover:bg-brand-hover active:bg-brand-active"
          >
            Browse content
            <FaDownload />
          </button>
        </div>

        {loading && <p className="text-[#a0a0a0]">Loading addons...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}

        {!loading && !error && (
          <div className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
            {baselineExtensions.length > 0 ? (
              baselineExtensions.map((base) => {
                const current = extensions.find((e) => e.addonFileName === base.addonFileName);
                const display = current ?? base;
                return (
                  <Addon
                    key={base.id}
                    name={display.name}
                    description={display.description}
                    isEnabled={display.isEnabled}
                    onToggle={handleToggleAddon}
                    onDelete={handleDeleteAddon}
                    preview={display.preview ? display.preview : undefined}
                    isToggling={false}
                    addonFileName={display.addonFileName}
                    authors={display.authors}
                    tags={display.tags}
                    imageURL={display.imageURL}
                    pendingDelete={!current}
                  />
                );
              })
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
      )}
      {installError && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex w-full max-w-sm flex-col rounded-xl border border-[#2a2a2a] bg-main p-6 shadow-lg">
            <div className="mb-4 flex flex-col items-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20">
                <FaExclamationTriangle className="h-6 w-6 text-red-400" />
              </div>
              <h2 className="mb-1 text-lg font-bold text-white">Install Failed</h2>
              <p className="mt-1 text-center text-sm text-[#a0a0a0]">{installError}</p>
            </div>
            <button
              onClick={() => setInstallError(null)}
              className="w-full rounded-lg bg-[#2a2a2a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3a3a3a] active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
