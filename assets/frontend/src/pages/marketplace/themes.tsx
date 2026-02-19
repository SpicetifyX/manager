import { FaChevronLeft, FaDownload, FaInfoCircle, FaSearch } from "react-icons/fa";
import Sidebar from "../../components/Sidebar";
import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Spinner from "../../components/Spinner";
import { app } from "../../../wailsjs/go/models";
import { fetchExtensionManifest, getTaggedRepos } from "../../utils/fetchRemotes";
import * as backend from "../../../wailsjs/go/app/App";
import ExtensionInfoModal from "../../components/ExtensionInfoModal";

export default function MarketplaceThemes() {
  const [addons, setAddons] = useState<app.AddonInfo[]>([]);
  const [communityExtensions, setCommunityExtensions] = useState<any[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityError, setCommunityError] = useState<string | null>(null);
  const [installingIndex, setInstallingIndex] = useState<number | null>(null);
  const [infoIndex, setInfoIndex] = useState<number | null>(null);
  const addonsRef = useRef<app.AddonInfo[]>([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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
      const extensions: any[] = [];
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

  useEffect(() => {
    (async () => {
      const resp = await backend.GetInstalledExtensions();
      setAddons(resp);
    })();

    fetchCommunityExtensions();
  }, []);

  const filteredExtensions = useMemo(() => {
    let result = communityExtensions.map((ext, idx) => ({ ext, origIdx: idx }));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        ({ ext }) =>
          ext.title?.toLowerCase().includes(q) ||
          ext.subtitle?.toLowerCase().includes(q) ||
          ext.user?.toLowerCase().includes(q) ||
          // @ts-ignore
          ext.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [communityExtensions, searchQuery]);

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

  const handleInstallExtension = async (ext: any, index: number) => {
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
      } else {
        alert(`Failed to install ${ext.title}`);
      }
    } catch (err: any) {
      alert(`Error installing ${ext.title}: ${err.message}`);
    } finally {
      setInstallingIndex(null);
    }
  };

  return (
    <div className="flex h-full w-full flex-1">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="flex h-full fixed w-[calc(100%-4rem)] flex-col overflow-hidden">
          <div className="flex w-full flex-shrink-0 flex-col border-b border-[#2a2a2a] bg-[#121418] select-none">
            <div className="flex h-12 items-center justify-between pl-1 pr-3">
              <div className="flex items-center gap-3">
                <Link
                  to={"/extensions"}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[#a0a0a0] transition-colors hover:bg-[#2a2a2a] hover:text-white"
                  title="Back"
                >
                  <FaChevronLeft />
                </Link>
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
            <div className="custom-scrollbar pb-16 min-h-0 flex-1 overflow-y-auto p-6 text-white">
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
                        <div className="flex aspect-auto h-full items-center justify-center rounded-t-lg bg-gradient-to-br from-[#1e2228] to-[#121418]">
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
              return <ExtensionInfoModal extension={ext} onClose={() => setInfoIndex(null)} />;
            })()}
        </div>
      </div>
    </div>
  );
}
