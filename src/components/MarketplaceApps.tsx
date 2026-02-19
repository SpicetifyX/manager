import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { AppInfo } from "../types/app.d";
import { FaChevronLeft, FaDownload, FaInfoCircle, FaSearch, FaTimes } from "react-icons/fa";
import App from "./App";
import { fetchAppManifest, getTaggedRepos } from "../utils/fetchRemotes";
import { CardItem } from "../utils/marketplace-types";
import Spinner from "./Spinner";
import AddonInfoModal, { AddonInfoData } from "./AddonInfoModal";
import ApplyModal from "./ApplyModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

export default function MarketplaceApps() {
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [browsingContent, setBrowsingContent] = useState(false);
  const [communityApps, setCommunityApps] = useState<CardItem[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityError, setCommunityError] = useState<string | null>(null);
  const [installingIndex, setInstallingIndex] = useState<number | null>(null);
  const [infoIndex, setInfoIndex] = useState<number | null>(null);
  const [applyModal, setApplyModal] = useState<{
    action: string;
    items: string[];
    isApplying: boolean;
  } | null>(null);
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
      setCommunityApps((prev) => (targetPage === 1 ? allApps : [...prev, ...allApps]));
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
      const fetchedApps = await window.electron.getSpicetifyApps();
      setApps(fetchedApps);
    } catch (err: any) {
      if (!silent) setError(err.message || "Failed to fetch apps.");
      console.error("Error fetching apps:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

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

  const handleToggleApp = async (appId: string, enable: boolean) => {
    const appName = apps.find((a) => a.id === appId)?.name || appId;
    setApplyModal({
      action: enable ? "Enabling App" : "Disabling App",
      items: [appName],
      isApplying: true,
    });
    setTogglingId(appId);
    setApps((prevApps) => prevApps.map((app) => (app.id === appId ? { ...app, isEnabled: enable } : app)));

    try {
      const success = await window.electron.toggleSpicetifyApp(appId, enable);
      if (!success) {
        setApps((prevApps) => prevApps.map((app) => (app.id === appId ? { ...app, isEnabled: !enable } : app)));
        setApplyModal(null);
        alert(`Failed to toggle app: ${appId}`);
      } else {
        setApplyModal((prev) => (prev ? { ...prev, isApplying: false } : null));
      }
      fetchApps(true);
    } catch (err: any) {
      console.error(`Error toggling app ${appId}:`, err);
      setApps((prevApps) => prevApps.map((app) => (app.id === appId ? { ...app, isEnabled: !enable } : app)));
      setApplyModal(null);
      alert(`Error toggling app: ${err.message}`);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteApp = (appId: string) => {
    const appName = apps.find((a) => a.id === appId)?.name || appId;
    setPendingDelete({ id: appId, name: appName });
  };

  const confirmDeleteApp = async () => {
    if (!pendingDelete) return;
    const { id: appId, name: appName } = pendingDelete;
    setPendingDelete(null);
    setApplyModal({
      action: "Deleting App",
      items: [appName],
      isApplying: true,
    });
    setTogglingId(appId);
    try {
      const success = await window.electron.deleteSpicetifyApp(appId);
      if (!success) {
        setApplyModal(null);
        alert(`Failed to delete app: ${appId}`);
      } else {
        setApplyModal((prev) => (prev ? { ...prev, isApplying: false } : null));
      }
      fetchApps(true);
    } catch (err: any) {
      console.error(`Error deleting app ${appId}:`, err);
      setApplyModal(null);
      alert(`Error deleting app: ${err.message}`);
    } finally {
      setTogglingId(null);
    }
  };

  const handleInstallApp = async (app: CardItem, index: number) => {
    if (app.installed) return;
    setInstallingIndex(index);
    setInfoIndex(null);
    setApplyModal({
      action: "Installing App",
      items: [app.title],
      isApplying: true,
    });
    try {
      const appName = app.title.replace(/[^a-zA-Z0-9_-]/g, "_");
      const meta = {
        name: app.title,
        description: app.subtitle,
        imageURL: app.imageURL,
        authors: app.authors,
        tags: app.tags,
        stars: app.stargazers_count,
      };
      const success = await window.electron.installMarketplaceApp(app.user, app.repo, appName, app.branch, meta);
      if (success) {
        setCommunityApps((prev) => prev.map((e, i) => (i === index ? { ...e, installed: true } : e)));
        fetchApps(true);
        setApplyModal((prev) => (prev ? { ...prev, isApplying: false } : null));
      } else {
        setApplyModal(null);
        alert(`Failed to install ${app.title}`);
      }
    } catch (err: any) {
      setApplyModal(null);
      alert(`Error installing ${app.title}: ${err.message}`);
    } finally {
      setInstallingIndex(null);
    }
  };

  const sortTags = ["Popular", "Newest", "Recently Updated"] as const;
  const contentTags = ["Stats", "Library", "Utility", "Official"] as const;
  const smartTags = [...sortTags, ...contentTags];

  const filteredApps = useMemo(() => {
    let result = communityApps.map((app, idx) => ({ app, origIdx: idx }));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        ({ app }) =>
          app.title?.toLowerCase().includes(q) ||
          app.subtitle?.toLowerCase().includes(q) ||
          app.user?.toLowerCase().includes(q) ||
          app.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }
    const activeContentTags = selectedTags.filter((t) => (contentTags as readonly string[]).includes(t));
    if (activeContentTags.length > 0) {
      result = result.filter(
        ({ app }) => Array.isArray(app.tags) && activeContentTags.every((tag) => app.tags.some((tt) => tt.toLowerCase() === tag.toLowerCase())),
      );
    }
    if (selectedTags.includes("Popular")) {
      result.sort((a, b) => (b.app.stargazers_count || 0) - (a.app.stargazers_count || 0));
    } else if (selectedTags.includes("Newest")) {
      result.sort((a, b) => new Date(b.app.created || 0).getTime() - new Date(a.app.created || 0).getTime());
    } else if (selectedTags.includes("Recently Updated")) {
      result.sort((a, b) => new Date(b.app.lastUpdated || 0).getTime() - new Date(a.app.lastUpdated || 0).getTime());
    }
    return result;
  }, [communityApps, searchQuery, selectedTags]);

  const lastAppElementRef = useCallback(
    (node: HTMLDivElement) => {
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
            <span className="text-gray-300">Browsing Community Apps</span>
          </div>
          <div className="relative">
            <FaSearch className="pointer-events-none absolute top-1/2 left-2.5 h-3 w-3 -translate-y-1/2 text-[#666]" />
            <input
              type="text"
              placeholder="Search apps..."
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
                className={`flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedTags.includes(tag) ? "bg-[#d63c6a] text-white" : "bg-[#1e2228] text-[#a0a0a0] hover:bg-[#2a2e34] hover:text-white"
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
              onClick={() => fetchCommunityApps()}
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
            <span className="text-lg text-gray-100">Fetching Apps</span>
          </div>
        </div>
      ) : communityApps.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <span className="text-lg text-[#a0a0a0]">No community apps found.</span>
        </div>
      ) : (
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-6 text-white">
          <div className="grid w-full grid-cols-3 gap-4">
            {filteredApps.map(({ app, origIdx }, i) => {
              const hasImage = app.imageURL && /\.(png|jpg|jpeg|gif|webp|svg)/i.test(app.imageURL);
              const isInstalling = installingIndex === origIdx;

              return (
                <div
                  ref={i === filteredApps.length - 1 ? lastAppElementRef : null}
                  key={`${app.user}/${app.repo}/${app.title}`}
                  className={`group relative flex h-64 max-h-64 w-full flex-col rounded-lg border ${app.installed ? "border-[#d63c6a]" : "border-[#2a2a2a]"} bg-[#121418] transition`}
                >
                  {hasImage ? (
                    <div className="relative aspect-square w-full overflow-hidden rounded-t-lg">
                      <div
                        className="absolute inset-0 scale-125 rounded-t-lg bg-cover bg-center blur-2xl"
                        style={{ backgroundImage: `url(${app.imageURL})` }}
                      />
                      <div className="absolute inset-0 rounded-t-lg bg-black/40" />
                      <img
                        src={app.imageURL}
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

                  {app.installed ? (
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
                          onClick={() => handleInstallApp(app, origIdx)}
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
                    <span className="text-md font-semibold text-white">{app.title}</span>
                    <span className="truncate text-sm text-gray-300">{app.subtitle}</span>
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
        communityApps[infoIndex] &&
        (() => {
          const app = communityApps[infoIndex];
          const infoData: AddonInfoData = {
            title: app.title,
            description: app.subtitle || app.description,
            imageURL: app.imageURL,
            authors: app.authors,
            tags: app.tags,
            stars: app.stargazers_count,
            lastUpdated: app.lastUpdated,
          };
          return (
            <AddonInfoModal
              info={infoData}
              onClose={() => setInfoIndex(null)}
              onInstall={() => handleInstallApp(app, infoIndex)}
              isInstalling={installingIndex === infoIndex}
            />
          );
        })()}
      {applyModal && (
        <ApplyModal action={applyModal.action} items={applyModal.items} isApplying={applyModal.isApplying} onClose={() => setApplyModal(null)} />
      )}
    </div>
  ) : (
    <>
      <div className="flex h-full flex-col p-4">
        <div className="mb-6 flex w-full items-center justify-between">
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
                  isToggling={togglingId === app.id}
                  imageURL={app.imageURL}
                />
              ))
            ) : (
              <p className="text-[#a0a0a0]">No apps found.</p>
            )}
          </div>
        )}
      </div>
      {applyModal && (
        <ApplyModal action={applyModal.action} items={applyModal.items} isApplying={applyModal.isApplying} onClose={() => setApplyModal(null)} />
      )}
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
