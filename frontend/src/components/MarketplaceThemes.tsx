import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { ThemeInfo } from "../types/theme.d";
import Theme from "./Theme";
import { FaChevronLeft, FaDownload, FaInfoCircle, FaSearch, FaTimes } from "react-icons/fa";
import { fetchThemeManifest, getTaggedRepos } from "../utils/fetchRemotes";
import { CardItem } from "../utils/marketplace-types";
import Spinner from "./Spinner";
import AddonInfoModal, { AddonInfoData } from "./AddonInfoModal";
import ApplyModal from "./ApplyModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

export default function MarketplaceThemes() {
  const [themes, setThemes] = useState<ThemeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyingThemeId, setApplyingThemeId] = useState<string | null>(null);
  const [browsingContent, setBrowsingContent] = useState(false);
  const [communityThemes, setCommunityThemes] = useState<CardItem[]>([]);
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
  const themesRef = useRef<ThemeInfo[]>([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const fetchCommunityThemes = async (loadMore = false) => {
    const targetPage = loadMore ? page + 1 : 1;
    if (targetPage === 1) {
      setCommunityLoading(true);
      setCommunityThemes([]);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }
    setCommunityError(null);

    try {
      const pageOfRepos = await getTaggedRepos("spicetify-themes", targetPage, [], false);
      const results = await Promise.allSettled(
        pageOfRepos.items.map((repo: any) =>
          fetchThemeManifest(repo.contents_url, repo.default_branch, repo.stargazers_count).then(
            (themes) =>
              themes?.map((t) => ({
                ...t,
                archived: repo.archived,
                lastUpdated: repo.pushed_at,
                created: repo.created_at,
              })) || [],
          ),
        ),
      );
      const allThemes: CardItem[] = [];
      const currentThemes = themesRef.current;
      for (const result of results) {
        if (result.status === "fulfilled" && result.value.length) {
          allThemes.push(
            ...result.value.map((t: any) => ({
              ...t,
              installed: currentThemes.some((th) => th.name === t.title),
            })),
          );
        }
      }
      setCommunityThemes((prev) => (targetPage === 1 ? allThemes : [...prev, ...allThemes]));
      setPage(targetPage);
      if (pageOfRepos.items.length === 0 || pageOfRepos.items.length < 30) {
        setHasMore(false);
      }
    } catch (err: any) {
      console.error("Failed to fetch community themes:", err);
      setCommunityError(err.message?.includes("403") ? "GitHub API rate limit reached. Try again later." : "Failed to load community themes.");
    } finally {
      if (targetPage === 1) {
        setCommunityLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  const fetchThemes = async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const fetchedThemes = await window.electron.getSpicetifyThemes();
      setThemes(fetchedThemes);
      themesRef.current = fetchedThemes;
    } catch (err: any) {
      if (!silent) setError(err.message || "Failed to fetch themes.");
      console.error("Error fetching themes:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  useEffect(() => {
    if (browsingContent) {
      fetchCommunityThemes();
    }
  }, [browsingContent]);

  useEffect(() => {
    if (communityThemes.length > 0) {
      setCommunityThemes((prev) =>
        prev.map((ct) => ({
          ...ct,
          installed: themes.some((t) => t.name === ct.title),
        })),
      );
    }
  }, [themes]);

  const handleSelectTheme = async (themeId: string) => {
    const themeName = themes.find((t) => t.id === themeId)?.name || themeId;
    setApplyModal({
      action: "Applying Theme",
      items: [themeName],
      isApplying: true,
    });
    setApplyingThemeId(themeId);
    try {
      const success = await window.electron.applySpicetifyTheme(themeId);
      if (!success) {
        setApplyModal(null);
        alert(`Failed to apply theme: ${themeId}`);
      } else {
        setApplyModal((prev) => (prev ? { ...prev, isApplying: false } : null));
      }
      fetchThemes(true);
    } catch (err: any) {
      console.error(`Error applying theme ${themeId}:`, err);
      setApplyModal(null);
      alert(`Error applying theme: ${err.message}`);
    } finally {
      setApplyingThemeId(null);
    }
  };

  const handleDeleteTheme = (themeId: string) => {
    const themeName = themes.find((t) => t.id === themeId)?.name || themeId;
    setPendingDelete({ id: themeId, name: themeName });
  };

  const confirmDeleteTheme = async () => {
    if (!pendingDelete) return;
    const { id: themeId, name: themeName } = pendingDelete;
    setPendingDelete(null);
    setApplyModal({
      action: "Deleting Theme",
      items: [themeName],
      isApplying: true,
    });
    try {
      const success = await window.electron.deleteSpicetifyTheme(themeId);
      if (success) {
        setApplyModal((prev) => (prev ? { ...prev, isApplying: false } : null));
        fetchThemes(true);
        setCommunityThemes((prev) => prev.map((t) => (t.title === themeName ? { ...t, installed: false } : t)));
      } else {
        setApplyModal(null);
        alert(`Failed to delete theme: ${themeName}`);
      }
    } catch (err: any) {
      setApplyModal(null);
      alert(`Error deleting theme: ${err.message}`);
    }
  };

  const handleInstallTheme = async (ext: CardItem, index: number) => {
    if (!ext.cssURL || ext.installed) return;
    setInstallingIndex(index);
    setInfoIndex(null);
    setApplyModal({
      action: "Installing Theme",
      items: [ext.title],
      isApplying: true,
    });
    try {
      const themeId = ext.title.replace(/[^a-zA-Z0-9_-]/g, "_");
      const meta = {
        name: ext.title,
        description: ext.subtitle,
        imageURL: ext.imageURL,
        authors: ext.authors,
        tags: ext.tags,
        stars: ext.stargazers_count,
      };
      const success = await window.electron.installMarketplaceTheme(themeId, ext.cssURL!, ext.schemesURL || '', ext.include || [], meta as any);
      if (success) {
        setCommunityThemes((prev) => prev.map((e, i) => (i === index ? { ...e, installed: true } : e)));
        fetchThemes(true);
        setApplyModal((prev) => (prev ? { ...prev, isApplying: false } : null));
      } else {
        setApplyModal(null);
        alert(`Failed to install ${ext.title}`);
      }
    } catch (err: any) {
      setApplyModal(null);
      alert(`Error installing ${ext.title}: ${err.message}`);
    } finally {
      setInstallingIndex(null);
    }
  };

  const sortTags = ["Popular", "Newest", "Recently Updated"] as const;
  const contentTags = ["Hazy", "Transparent", "Dark", "Minimal"] as const;
  const smartTags = [...sortTags, ...contentTags];

  const filteredThemes = useMemo(() => {
    let result = communityThemes.map((t, idx) => ({ theme: t, origIdx: idx }));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        ({ theme: t }) =>
          t.title?.toLowerCase().includes(q) ||
          t.subtitle?.toLowerCase().includes(q) ||
          t.user?.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(q)),
      );
    }
    // Content tag filtering (Dark, Colorful, Minimal)
    const activeContentTags = selectedTags.filter((t) => (contentTags as readonly string[]).includes(t));
    if (activeContentTags.length > 0) {
      result = result.filter(({ theme: t }) =>
        Array.isArray(t.tags) && activeContentTags.every((tag) => t.tags.some((tt) => tt.toLowerCase() === tag.toLowerCase())),
      );
    }
    // Sort tag (mutually exclusive)
    if (selectedTags.includes("Popular")) {
      result.sort((a, b) => (b.theme.stargazers_count || 0) - (a.theme.stargazers_count || 0));
    } else if (selectedTags.includes("Newest")) {
      result.sort((a, b) => new Date(b.theme.created || 0).getTime() - new Date(a.theme.created || 0).getTime());
    } else if (selectedTags.includes("Recently Updated")) {
      result.sort((a, b) => new Date(b.theme.lastUpdated || 0).getTime() - new Date(a.theme.lastUpdated || 0).getTime());
    }
    return result;
  }, [communityThemes, searchQuery, selectedTags]);

  const observer = useRef<IntersectionObserver>();
  const lastThemeElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (communityLoading || loadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchCommunityThemes(true);
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
            <span className="text-gray-300">Browsing Community Themes</span>
          </div>
          <div className="relative">
            <FaSearch className="pointer-events-none absolute top-1/2 left-2.5 h-3 w-3 -translate-y-1/2 text-[#666]" />
            <input
              type="text"
              placeholder="Search themes..."
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
                onClick={() => setSelectedTags((prev) => {
                  if (prev.includes(tag)) return prev.filter((t) => t !== tag);
                  if (isSortTag) return [...prev.filter((t) => !(sortTags as readonly string[]).includes(t)), tag];
                  return [...prev, tag];
                })}
                className={`flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? "bg-[#d63c6a] text-white"
                    : "bg-[#1e2228] text-[#a0a0a0] hover:bg-[#2a2e34] hover:text-white"
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
              onClick={() => fetchCommunityThemes()}
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
            <span className="text-lg text-gray-100">Fetching Themes</span>
          </div>
        </div>
      ) : communityThemes.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <span className="text-lg text-[#a0a0a0]">No community themes found.</span>
        </div>
      ) : (
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-6 text-white">
          <div className="grid w-full grid-cols-3 gap-4">
            {filteredThemes.map(({ theme: ext, origIdx }, i) => {
              const hasImage = ext.imageURL && /\.(png|jpg|jpeg|gif|webp|svg)/i.test(ext.imageURL);
              const isInstalling = installingIndex === origIdx;

              return (
                <div
                  ref={i === filteredThemes.length - 1 ? lastThemeElementRef : null}
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
                          onClick={() => handleInstallTheme(ext, origIdx)}
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
        communityThemes[infoIndex] &&
        (() => {
          const ext = communityThemes[infoIndex];
          const infoData: AddonInfoData = {
            title: ext.title,
            description: ext.subtitle || ext.description,
            imageURL: ext.imageURL,
            authors: ext.authors,
            tags: ext.tags,
            stars: ext.stargazers_count,
            lastUpdated: ext.lastUpdated,
            installed: ext.installed,
          };
          const handleInstallFromModal = async () => {
            await handleInstallTheme(ext, infoIndex);
          };
          return (
            <AddonInfoModal
              info={infoData}
              onClose={() => setInfoIndex(null)}
              onInstall={handleInstallFromModal}
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
            <h1 className="text-2xl font-bold text-white">Installed Themes</h1>
            <p className="text-[#a0a0a0]">Select a theme for your Spotify client.</p>
          </div>
          <button
            onClick={() => setBrowsingContent(true)}
            className="flex h-8 w-fit items-center gap-2 rounded-full bg-[#d63c6a] px-4 py-2 text-sm font-semibold whitespace-nowrap text-white transition-all duration-200 hover:bg-[#c52c5a] active:bg-[#b51c4a]"
          >
            Browse content
            <FaDownload />
          </button>
        </div>

        {loading && <p className="text-[#a0a0a0]">Loading themes...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}

        {!loading && !error && (
          <div className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
            {themes.length > 0 ? (
              themes.map((theme, idx) => (
                <Theme
                  key={idx}
                  theme={theme}
                  onSelect={handleSelectTheme}
                  onDelete={!theme.isBundled ? handleDeleteTheme : undefined}
                  isApplying={applyingThemeId === theme.id}
                />
              ))
            ) : (
              <p className="text-[#a0a0a0]">No themes found.</p>
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
        itemType="theme"
        onConfirm={confirmDeleteTheme}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
