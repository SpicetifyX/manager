import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { AppInfo } from "../types/app.d";
import { FaDownload } from "react-icons/fa";
import App from "./App";
import { fetchAppManifest, fetchCurated, getTaggedRepos } from "../utils/fetchRemotes";
import { CardItem } from "../utils/marketplace-types";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import * as backend from "../../wailsjs/go/app/App";
import { useSpicetify } from "../context/SpicetifyContext";
import MarketplaceBrowseView from "./MarketplaceBrowseView";

export default function MarketplaceApps({
  onDirtyChange,
  resetKey,
  snapshotKey,
}: {
  onDirtyChange: (dirty: boolean) => void;
  resetKey: number;
  snapshotKey: number;
}) {
  const { apps: contextApps, appsLoaded, refreshApps, setAppsLocally } = useSpicetify();

  const [apps, setApps] = useState<AppInfo[]>(contextApps);
  const [loading, setLoading] = useState(!appsLoaded);
  const [error, setError] = useState<string | null>(null);
  const [browsingContent, setBrowsingContent] = useState(false);
  const [communityApps, setCommunityApps] = useState<CardItem[]>([]);
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
  const observer = useRef<IntersectionObserver>();

  const fetchCommunityApps = async (loadMore = false) => {
    const targetPage = loadMore ? page + 1 : 1;
    if (targetPage === 1) {
      setCommunityLoading(true);
      setCommunityApps([]);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }
    setCommunityError(null);

    try {
      const pageOfRepos = await getTaggedRepos("spicetify-apps", targetPage, [], false);
      const results = await Promise.allSettled(
        pageOfRepos.items.map((repo: any) =>
          fetchAppManifest(repo.contents_url, repo.default_branch, repo.stargazers_count).then(
            (apps) =>
              apps?.map((a) => ({
                ...a,
                archived: repo.archived,
                lastUpdated: repo.pushed_at,
                created: repo.created_at,
              })) || [],
          ),
        ),
      );
      const allApps: CardItem[] = [];
      const currentApps = apps;
      for (const result of results) {
        if (result.status === "fulfilled" && result.value.length) {
          allApps.push(
            ...result.value.map((a: any) => ({
              ...a,
              installed: currentApps.some((ia) => ia.name === a.title),
            })),
          );
        }
      }

      if (targetPage === 1) {
        const curated = await fetchCurated();
        const curatedApps = curated.apps
          .filter((c) => !allApps.some((a) => a.user === c.user && a.repo === c.repo))
          .map((c) => ({ ...c, installed: currentApps.some((ia) => ia.name === c.title) }));
        setCommunityApps([...curatedApps, ...allApps]);
      } else {
        setCommunityApps((prev) => [...prev, ...allApps]);
      }
      setPage(targetPage);
      if (pageOfRepos.items.length === 0 || pageOfRepos.items.length < 30) {
        setHasMore(false);
      }
    } catch (err: any) {
      console.error("Failed to fetch community apps:", err);
      setCommunityError(err.message?.includes("403") ? "GitHub API rate limit reached. Try again later." : "Failed to load community apps.");
    } finally {
      if (targetPage === 1) {
        setCommunityLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  const fetchApps = async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      await refreshApps();
    } catch (err: any) {
      if (!silent) setError(err.message || "Failed to fetch apps.");
      console.error("Error fetching apps:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Sync from global context → local state + baseline / dirty check
  useEffect(() => {
    if (!appsLoaded) return;
    setApps(contextApps);
  }, [contextApps, appsLoaded]);

  // Recapture baseline for dirty detection
  const [baseline, setBaseline] = useState<Map<string, boolean>>(new Map());
  useEffect(() => {
    if (snapshotKey > 0 || appsLoaded) {
      setBaseline(new Map(contextApps.map((a) => [a.id, a.isEnabled])));
    }
  }, [snapshotKey, appsLoaded]);

  useEffect(() => {
    const isDirty = apps.some((a) => {
      const base = baseline.get(a.id);
      return base === undefined || base !== a.isEnabled;
    });
    onDirtyChange(isDirty);
  }, [apps, baseline]);

  useEffect(() => {
    if (browsingContent) {
      fetchCommunityApps();
    }
  }, [browsingContent]);

  useEffect(() => {
    if (communityApps.length > 0) {
      setCommunityApps((prev) =>
        prev.map((ca) => ({
          ...ca,
          installed: apps.some((ia) => ia.name === ca.title),
        })),
      );
    }
  }, [apps]);

  const handleToggleApp = (appId: string, enable: boolean) => {
    const updated = apps.map((app) => (app.id === appId ? { ...app, isEnabled: enable } : app));
    setApps(updated);
    setAppsLocally(updated);
  };

  const handleDeleteApp = (appId: string) => {
    const appName = apps.find((a) => a.id === appId)?.name || appId;
    setPendingDelete({ id: appId, name: appName });
  };

  const confirmDeleteApp = async () => {
    if (!pendingDelete) return;
    const { id: appId } = pendingDelete;
    setPendingDelete(null);
    try {
      const success = await backend.DeleteSpicetifyApp(appId);
      if (!success) {
        alert(`Failed to delete app: ${appId}`);
      }
      fetchApps(true);
    } catch (err: any) {
      console.error(`Error deleting app ${appId}:`, err);
      alert(`Error deleting app: ${err.message}`);
    }
  };

  const handleInstallApp = async (app: CardItem, index: number) => {
    if (app.installed) return;
    setInstallingIndex(index);
    setInfoIndex(null);
    try {
      const appName = app.title.replace(/[^a-zA-Z0-9_-]/g, "_");
      const meta = {
        name: app.title,
        description: app.subtitle,
        imageURL: app.imageURL,
        authors: app.authors,
        tags: app.tags,
        stars: app.stargazers_count,
        subdir: (app.manifest as any)?.subdir || "",
      };
      const success = await backend.InstallMarketplaceApp(app.user, app.repo, appName, app.branch, meta as any);
      if (success) {
        setCommunityApps((prev) => prev.map((e, i) => (i === index ? { ...e, installed: true } : e)));
        fetchApps(true);
      } else {
        alert(`Failed to install ${app.title}`);
      }
    } catch (err: any) {
      alert(`Error installing ${app.title}: ${err.message}`);
    } finally {
      setInstallingIndex(null);
    }
  };

  const sortTags = ["Popular", "Newest", "Recently Updated"] as const;
  const contentTags = ["Stats", "Library", "Utility", "Official"] as const;
  const smartTags = [...sortTags, ...contentTags];

  const filteredApps = useMemo(() => {
    let result = communityApps.map((item, idx) => ({ item, origIdx: idx }));
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
  }, [communityApps, searchQuery, selectedTags]);

  const lastAppElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (communityLoading || loadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchCommunityApps(true);
        }
      });
      if (node) observer.current.observe(node);
    },
    [communityLoading, loadingMore, hasMore],
  );

  return browsingContent ? (
    <MarketplaceBrowseView
      title="Browsing Community Apps"
      searchPlaceholder="Search apps..."
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onBack={() => setBrowsingContent(false)}
      allTags={smartTags}
      sortTags={sortTags}
      selectedTags={selectedTags}
      onTagsChange={setSelectedTags}
      error={communityError}
      onRetry={fetchCommunityApps}
      loading={communityLoading}
      loadingLabel="Fetching Apps"
      emptyLabel="No community apps found."
      items={filteredApps}
      allItems={communityApps}
      installingIndex={installingIndex}
      onInstall={handleInstallApp}
      loadingMore={loadingMore}
      lastItemRef={lastAppElementRef}
      infoIndex={infoIndex}
      onInfo={setInfoIndex}
      onInfoClose={() => setInfoIndex(null)}
    />
  ) : (
    <>
      <div className="flex h-full flex-col p-4">
        <div className="mb-4 flex w-full items-center justify-between border-b border-[#1e2228] pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Installed Apps</h1>
            <p className="text-[#a0a0a0]">Manage your Spicetify custom apps.</p>
          </div>
          <button
            onClick={() => setBrowsingContent(true)}
            className="flex h-8 w-fit items-center gap-2 rounded-full bg-[#d63c6a] px-4 py-2 text-sm font-semibold whitespace-nowrap text-white transition-all duration-200 hover:bg-[#c52c5a] active:bg-[#b51c4a]"
          >
            Browse content
            <FaDownload />
          </button>
        </div>
        {loading && <p className="text-[#a0a0a0]">Loading apps...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        {!loading && !error && (
          <div className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
            {apps.length > 0 ? (
              apps.map((app) => (
                <App
                  key={app.id}
                  name={app.name}
                  appId={app.id}
                  isEnabled={app.isEnabled}
                  onToggle={handleToggleApp}
                  onDelete={handleDeleteApp}
                  isToggling={false}
                  imageURL={app.imageURL}
                />
              ))
            ) : (
              <p className="text-[#a0a0a0]">No apps found.</p>
            )}
          </div>
        )}
      </div>
      <ConfirmDeleteModal
        show={!!pendingDelete}
        itemName={pendingDelete?.name || ""}
        itemType="app"
        onConfirm={confirmDeleteApp}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
