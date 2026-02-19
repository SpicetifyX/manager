import type { CardItem, RepoTopic, Snippet, Author } from "./marketplace-types";

const ITEMS_PER_REQUEST = 100;
const SNIPPETS_URL = "https://raw.githubusercontent.com/spicetify/marketplace/main/resources/snippets.json";
const BLACKLIST_URL = "https://raw.githubusercontent.com/spicetify/marketplace/main/resources/blacklist.json";

export const sanitizeUrl = (url: string) => {
  const u = decodeURI(url).trim().toLowerCase();
  if (u.startsWith("javascript:") || u.startsWith("data:") || u.startsWith("vbscript:")) return "about:blank";
  return url;
};

const matchesBlacklistPattern = (url: string, pattern: string): boolean => {
  const normalizedUrl = url.toLowerCase();
  const normalizedPattern = pattern.toLowerCase();

  if (!normalizedPattern.includes("*")) return normalizedUrl === normalizedPattern;

  const regexPattern = normalizedPattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]+");

  return new RegExp(`^${regexPattern}$`).test(normalizedUrl);
};

export const isBlacklisted = (url: string, blacklist: string[]): boolean => {
  return blacklist.some((pattern) => matchesBlacklistPattern(url, pattern));
};

export const processAuthors = (authors: Author[], user: string) => {
  let parsedAuthors: Author[] = [];

  if (authors && authors.length > 0) {
    parsedAuthors = authors.map((author) => ({
      name: author.name,
      url: sanitizeUrl(author.url),
    }));
  } else {
    parsedAuthors.push({
      name: user,
      url: `https://github.com/${user}`,
    });
  }

  return parsedAuthors;
};

export async function getTaggedRepos(tag: RepoTopic, page = 1, BLACKLIST: string[] = [], showArchived = false) {
  let url = `https://api.github.com/search/repositories?q=${encodeURIComponent(`topic:${tag}`)}&per_page=${ITEMS_PER_REQUEST}`;

  if (page) url += `&page=${page}`;
  const allRepos =
    JSON.parse(window.sessionStorage.getItem(`${tag}-page-${page}`) || "null") ||
    (await fetch(url)
      .then((res) => res.json())
      .catch(() => null));

  if (!allRepos?.items) {
    return { items: [] };
  }

  window.sessionStorage.setItem(`${tag}-page-${page}`, JSON.stringify(allRepos));

  const filteredResults = {
    ...allRepos,
    page_count: allRepos.items.length,
    items: allRepos.items.filter((item: any) => !isBlacklisted(item.html_url, BLACKLIST) && (showArchived || !item.archived)),
  };

  return filteredResults;
}

const script = `
  self.addEventListener('message', async (event) => {
    const url = event.data;
    const response = await fetch(url);
    const data = await response.json().catch(() => null);
    self.postMessage(data);
  });
`;
const blob = new Blob([script], { type: "application/javascript" });
const workerURL = URL.createObjectURL(blob);

async function fetchRepoManifest(url: string) {
  const worker = new Worker(workerURL);
  return new Promise((resolver) => {
    const resolve = (data: any) => {
      worker.terminate();
      resolver(data);
    };

    worker.postMessage(url);
    worker.addEventListener("message", (event) => resolve(event.data), {
      once: true,
    });
    worker.addEventListener("error", () => resolve(null), { once: true });
  });
}

async function getRepoManifest(user: string, repo: string, branch: string) {
  const key = `${user}-${repo}`;
  const sessionStorageItem = window.sessionStorage.getItem(key);
  if (sessionStorageItem) return JSON.parse(sessionStorageItem);

  const failedKey = "noManifests";
  const failedSessionStorageItems: string[] = JSON.parse(window.sessionStorage.getItem(failedKey) || "[]");

  const url = `https://raw.githubusercontent.com/${user}/${repo}/${branch}/manifest.json`;
  if (failedSessionStorageItems.includes(url)) return null;

  let manifest = await fetchRepoManifest(url);

  if (!manifest) {
    failedSessionStorageItems.push(url);
    window.sessionStorage.setItem(failedKey, JSON.stringify(failedSessionStorageItems));
    return null;
  }

  if (!Array.isArray(manifest)) manifest = [manifest];

  window.sessionStorage.setItem(key, JSON.stringify(manifest));
  return manifest;
}

export async function fetchExtensionManifest(contents_url: string, branch: string, stars: number, hideInstalled = false) {
  try {
    const regex_result = contents_url.match(/https:\/\/api\.github\.com\/repos\/(?<user>.+)\/(?<repo>.+)\/contents/);
    if (!regex_result || !regex_result.groups) return null;
    const { user, repo } = regex_result.groups;

    const manifests = await getRepoManifest(user, repo, branch);

    if (!manifests) return [];

    const parsedManifests: CardItem[] = manifests.reduce((accum: any, manifest: any) => {
      if (manifest?.name && manifest.description && manifest.main) {
        const selectedBranch = manifest.branch || branch;
        const item = {
          manifest,
          title: manifest.name,
          subtitle: manifest.description,
          authors: processAuthors(manifest.authors, user),
          user,
          repo,
          branch: selectedBranch,

          imageURL: manifest.preview?.startsWith("http")
            ? manifest.preview
            : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.preview}`,
          extensionURL: manifest.main.startsWith("http")
            ? manifest.main
            : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.main}`,
          readmeURL: manifest.readme?.startsWith("http")
            ? manifest.readme
            : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.readme}`,
          stars,
          tags: manifest.tags,
        };
        if (!(hideInstalled && localStorage.getItem(`marketplace:installed:${user}/${repo}/${manifest.main}`))) {
          accum.push(item);
        }
      }

      return accum;
    }, []);

    return parsedManifests;
  } catch {
    return null;
  }
}

export async function fetchThemeManifest(contents_url: string, branch: string, stars: number) {
  try {
    const regex_result = contents_url.match(/https:\/\/api\.github\.com\/repos\/(?<user>.+)\/(?<repo>.+)\/contents/);
    if (!regex_result || !regex_result.groups) return null;
    const { user, repo } = regex_result.groups;

    const manifests = await getRepoManifest(user, repo, branch);

    if (!manifests) return [];

    const parsedManifests: CardItem[] = manifests.reduce((accum: any, manifest: any) => {
      if (manifest?.name && manifest?.usercss && manifest?.description) {
        const selectedBranch = manifest.branch || branch;
        const item = {
          manifest,
          title: manifest.name,
          subtitle: manifest.description,
          authors: processAuthors(manifest.authors, user),
          user,
          repo,
          branch: selectedBranch,
          imageURL: manifest.preview?.startsWith("http")
            ? manifest.preview
            : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.preview}`,
          readmeURL: manifest.readme?.startsWith("http")
            ? manifest.readme
            : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.readme}`,
          stars,
          tags: manifest.tags,
          cssURL: manifest.usercss.startsWith("http")
            ? manifest.usercss
            : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.usercss}`,
          schemesURL: manifest.schemes
            ? manifest.schemes.startsWith("http")
              ? manifest.schemes
              : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.schemes}`
            : null,
          include:
            manifest.include && Array.isArray(manifest.include)
              ? manifest.include.map((inc: string) =>
                  inc.startsWith("http") ? inc : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${inc}`,
                )
              : undefined,
        };

        accum.push(item);
      }

      return accum;
    }, []);
    return parsedManifests;
  } catch (e) {
    console.log(e);
    return null;
  }
}

export async function fetchAppManifest(contents_url: string, branch: string, stars: number) {
  try {
    const regex_result = contents_url.match(/https:\/\/api\.github\.com\/repos\/(?<user>.+)\/(?<repo>.+)\/contents/);
    if (!regex_result || !regex_result.groups) return null;
    const { user, repo } = regex_result.groups;

    const manifests = await getRepoManifest(user, repo, branch);

    if (!manifests) return [];

    const parsedManifests: CardItem[] = manifests.reduce((accum: any, manifest: any) => {
      if (manifest?.name && manifest.description && !manifest.main && !manifest.usercss) {
        const selectedBranch = manifest.branch || branch;
        const item = {
          manifest,
          title: manifest.name,
          subtitle: manifest.description,
          authors: processAuthors(manifest.authors, user),
          user,
          repo,
          branch: selectedBranch,

          imageURL: manifest.preview?.startsWith("http")
            ? manifest.preview
            : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.preview}`,
          readmeURL: manifest.readme?.startsWith("http")
            ? manifest.readme
            : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.readme}`,
          stars,
          tags: manifest.tags,
        };

        accum.push(item);
      }
      return accum;
    }, []);

    return parsedManifests;
  } catch (e) {
    console.log(e);
    return null;
  }
}

export const getBlacklist = async () => {
  const json = await fetch(BLACKLIST_URL)
    .then((res) => res.json())
    .catch(() => ({}));
  return json.repos as string[] | undefined;
};

export const fetchCssSnippets = async (hideInstalled = false) => {
  const snippetsJSON = (await fetch(SNIPPETS_URL)
    .then((res) => res.json())
    .catch(() => [])) as Snippet[];
  if (!snippetsJSON.length) return [];

  const snippets = snippetsJSON.reduce<Snippet[]>((accum, snippet) => {
    const snip = { ...snippet } as Snippet;

    if (snip.preview) {
      snip.imageURL = snip.preview.startsWith("http")
        ? snip.preview
        : `https://raw.githubusercontent.com/spicetify/spicetify-marketplace/main/${snip.preview}`;
      snip.preview = undefined;
    }

    if (!(hideInstalled && localStorage.getItem(`marketplace:installed:snippet:${snip.title.replace(" ", "-")}`))) {
      accum.push(snip);
    }

    return accum;
  }, []);

  return snippets;
};
