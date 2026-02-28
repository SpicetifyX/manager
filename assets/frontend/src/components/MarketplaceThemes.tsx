import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { ThemeInfo } from "../types/theme.d";
import Theme from "./Theme";
import { FaDownload } from "react-icons/fa";
import { fetchThemeManifest, getTaggedRepos } from "../utils/fetchRemotes";
import { CardItem } from "../utils/marketplace-types";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import * as backend from "../../wailsjs/go/app/App";
import { useSpicetify } from "../context/SpicetifyContext";
import MarketplaceBrowseView from "./MarketplaceBrowseView";

export default function MarketplaceThemes({
  onDirtyChange,
  snapshotKey,
}: {
  onDirtyChange: (dirty: boolean) => void;
  resetKey: number;
  snapshotKey: number;
}) {
  const { themes: contextThemes, themesLoaded, refreshThemes, setThemesLocally } = useSpicetify();

  const [themes, setThemes] = useState<ThemeInfo[]>(contextThemes);
  const [loading, setLoading] = useState(!themesLoaded);
  const [error, setError] = useState<string | null>(null);
  const [browsingContent, setBrowsingContent] = useState(false);
  const [communityThemes, setCommunityThemes] = useState<CardItem[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityError, setCommunityError] = useState<string | null>(null);
  const [installingIndex, setInstallingIndex] = useState<number | null>(null);
  const [infoIndex, setInfoIndex] = useState<number | null>(null);
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

      if (targetPage === 1) {
        setCommunityThemes([...allThemes]);
      } else {
        setCommunityThemes((prev) => [...prev, ...allThemes]);
      }
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
      await refreshThemes();
    } catch (err: any) {
      if (!silent) setError(err.message || "Failed to fetch themes.");
      console.error("Error fetching themes:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!themesLoaded) return;
    setThemes(contextThemes);
    themesRef.current = contextThemes;
  }, [contextThemes, themesLoaded]);

  const [baseline, setBaseline] = useState<{ activeThemeId: string; colorScheme: string; installedIds: string[] } | null>(null);
  useEffect(() => {
    if (snapshotKey > 0 || themesLoaded) {
      const activeTheme = contextThemes.find((t) => t.isActive);
      setBaseline({
        activeThemeId: activeTheme?.id ?? "",
        colorScheme: activeTheme?.activeColorScheme ?? "",
        installedIds: contextThemes.map((t) => t.id),
      });
    }
  }, [snapshotKey, themesLoaded]);

  useEffect(() => {
    if (!baseline) return;
    const activeTheme = themes.find((t) => t.isActive);
    const currentId = activeTheme?.id ?? "";
    const currentScheme = activeTheme?.activeColorScheme ?? "";

    const baselineInstalled = new Set(baseline.installedIds);
    const installedNow = new Set(themes.map((t) => t.id));

    const isDirty =
      currentId !== baseline.activeThemeId ||
      currentScheme !== baseline.colorScheme ||
      themes.some((t) => !baselineInstalled.has(t.id)) ||
      baseline.installedIds.some((id) => !installedNow.has(id));
    onDirtyChange(isDirty);
  }, [themes, baseline]);

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

  const handleSelectTheme = (themeId: string) => {
    const updated = themes.map((t) => ({ ...t, isActive: t.id === themeId }));
    setThemes(updated);
    setThemesLocally(updated);
  };

  const handleSetColorScheme = (themeId: string, scheme: string) => {
    const updated = themes.map((t) => (t.id === themeId ? { ...t, activeColorScheme: scheme } : t));
    setThemes(updated);
    setThemesLocally(updated);
  };

  const handleDeleteTheme = (themeId: string) => {
    const themeName = themes.find((t) => t.id === themeId)?.name || themeId;
    setPendingDelete({ id: themeId, name: themeName });
  };

  const confirmDeleteTheme = async () => {
    if (!pendingDelete) return;
    const { id: themeId, name: themeName } = pendingDelete;
    setPendingDelete(null);
    try {
      const success = await backend.DeleteSpicetifyTheme(themeId);
      if (success) {
        fetchThemes(true);
        setCommunityThemes((prev) => prev.map((t) => (t.title === themeName ? { ...t, installed: false } : t)));
      } else {
        alert(`Failed to delete theme: ${themeName}`);
      }
    } catch (err: any) {
      alert(`Error deleting theme: ${err.message}`);
    }
  };

  const handleInstallTheme = async (ext: CardItem, index: number) => {
    if (!ext.cssURL || ext.installed) return;
    setInstallingIndex(index);
    setInfoIndex(null);
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
      const success = await backend.InstallMarketplaceTheme(themeId, ext.cssURL!, ext.schemesURL || "", ext.include || [], meta as any);
      if (success) {
        setCommunityThemes((prev) => prev.map((e, i) => (i === index ? { ...e, installed: true } : e)));
        fetchThemes(true);
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
  const contentTags = ["Hazy", "Transparent", "Dark", "Minimal", "Official"] as const;
  const smartTags = [...sortTags, ...contentTags];

  const filteredThemes = useMemo(() => {
    let result = communityThemes.map((item, idx) => ({ item, origIdx: idx }));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        ({ item }) =>
          item.title?.toLowerCase().includes(q) ||
          item.subtitle?.toLowerCase().includes(q) ||
          item.user?.toLowerCase().includes(q) ||
          item.tags?.some((tag) => tag.toLowerCase().includes(q)),
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
  }, [communityThemes, searchQuery, selectedTags]);

  const observer = useRef<IntersectionObserver>();
  const lastThemeElementRef = useCallback(
    (node: HTMLDivElement | null) => {
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
    <MarketplaceBrowseView
      title="Browsing Community Themes"
      searchPlaceholder="Search themes..."
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onBack={() => setBrowsingContent(false)}
      allTags={smartTags}
      sortTags={sortTags}
      selectedTags={selectedTags}
      onTagsChange={setSelectedTags}
      error={communityError}
      onRetry={fetchCommunityThemes}
      loading={communityLoading}
      loadingLabel="Fetching Themes"
      emptyLabel="No community themes found."
      items={filteredThemes}
      allItems={communityThemes}
      installingIndex={installingIndex}
      onInstall={handleInstallTheme}
      loadingMore={loadingMore}
      lastItemRef={lastThemeElementRef}
      infoIndex={infoIndex}
      onInfo={setInfoIndex}
      onInfoClose={() => setInfoIndex(null)}
    />
  ) : (
    <>
      <div className="flex h-full flex-col p-4">
        <div className="mb-4 flex w-full items-center justify-between border-b border-[#1e2228] pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Installed Themes</h1>
            <p className="text-[#a0a0a0] text-sm mt-1">Select a theme for your Spotify client.</p>
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
                  onSetColorScheme={handleSetColorScheme}
                  onDelete={!theme.isBundled ? handleDeleteTheme : undefined}
                  isApplying={false}
                />
              ))
            ) : (
              <p className="text-[#a0a0a0]">No themes found.</p>
            )}
          </div>
        )}
      </div>
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
