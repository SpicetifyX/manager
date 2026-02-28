export function getRawGitHubUrl(url: string): string {
  if (!url || typeof url !== "string") return "";

  // If it's already a raw URL or not a GitHub URL, return clean version
  if (url.includes("raw.githubusercontent.com") || !url.includes("github.com")) {
    return url.split("?")[0];
  }

  try {
    const cleanUrl = url.split("?")[0];

    // github.com/{user}/{repo}/blob/{branch}/{path}
    const blobRegex = /https?:\/\/github\.com\/(?<user>[^/]+)\/(?<repo>[^/]+)\/blob\/(?<branch>[^/]+)\/(?<path>.+)/;
    const blobMatch = cleanUrl.match(blobRegex);
    if (blobMatch?.groups) {
      const { user, repo, branch, path } = blobMatch.groups;
      return `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${path}`;
    }

    // github.com/{user}/{repo}/raw/{branch}/{path}
    const rawRegex = /https?:\/\/github\.com\/(?<user>[^/]+)\/(?<repo>[^/]+)\/raw\/(?<branch>[^/]+)\/(?<path>.+)/;
    const rawMatch = cleanUrl.match(rawRegex);
    if (rawMatch?.groups) {
      const { user, repo, branch, path } = rawMatch.groups;
      return `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${path}`;
    }
  } catch (err) {
    console.error("Error converting to raw GitHub URL:", err);
  }

  return url.split("?")[0];
}

export function getJsDelivrUrl(url: string): string {
  if (!url || typeof url !== "string") return "";

  // If it's already a jsDelivr or other CDN URL, or if it doesn't contain github strings, return as is
  if (url.includes("cdn.jsdelivr.net") || (!url.includes("raw.githubusercontent.com") && !url.includes("github.com"))) {
    return url;
  }

  try {
    // Strip query parameters for conversion (e.g. ?raw=true)
    const cleanUrl = url.split("?")[0];

    // Handle raw.githubusercontent.com URLs
    if (cleanUrl.includes("raw.githubusercontent.com")) {
      // 1. raw.githubusercontent.com/{user}/{repo}/refs/heads/{branch}/{path}
      const refsRegex = /https?:\/\/raw\.githubusercontent\.com\/(?<user>[^/]+)\/(?<repo>[^/]+)\/refs\/heads\/(?<branch>[^/]+)\/(?<path>.+)/;
      const refsMatch = cleanUrl.match(refsRegex);
      if (refsMatch?.groups) {
        const { user, repo, branch, path } = refsMatch.groups;
        return `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${path}`;
      }

      // 2. raw.githubusercontent.com/{user}/{repo}/{branch}/{path}
      const rawRegex = /https?:\/\/raw\.githubusercontent\.com\/(?<user>[^/]+)\/(?<repo>[^/]+)\/(?<branch>[^/]+)\/(?<path>.+)/;
      const rawMatch = cleanUrl.match(rawRegex);
      if (rawMatch?.groups) {
        const { user, repo, branch, path } = rawMatch.groups;
        return `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${path}`;
      }
    }

    // Handle github.com URLs
    if (cleanUrl.includes("github.com")) {
      // 1. github.com/{user}/{repo}/blob/{branch}/{path}
      const blobRegex = /https?:\/\/github\.com\/(?<user>[^/]+)\/(?<repo>[^/]+)\/blob\/(?<branch>[^/]+)\/(?<path>.+)/;
      const blobMatch = cleanUrl.match(blobRegex);
      if (blobMatch?.groups) {
        const { user, repo, branch, path } = blobMatch.groups;
        return `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${path}`;
      }

      // 2. github.com/{user}/{repo}/raw/{branch}/{path}
      const githubRawRegex = /https?:\/\/github\.com\/(?<user>[^/]+)\/(?<repo>[^/]+)\/raw\/(?<branch>[^/]+)\/(?<path>.+)/;
      const githubRawMatch = cleanUrl.match(githubRawRegex);
      if (githubRawMatch?.groups) {
        const { user, repo, branch, path } = githubRawMatch.groups;
        return `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${path}`;
      }
    }
  } catch (err) {
    console.error("Error converting to jsDelivr URL:", err);
  }

  return url.split("?")[0];
}

export function getGitHubUsernameFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === "github.com" || urlObj.hostname === "www.github.com") {
      const pathParts = urlObj.pathname.split("/").filter(Boolean);
      if (pathParts.length >= 1) {
        return pathParts[0];
      }
    }
  } catch (error) {
    console.error("Invalid URL provided:", url, error);
  }
  return null;
}

export function getGitHubProfileImageUrl(username: string, size: number = 32): string {
  return `https://github.com/${username}.png?size=${size}`;
}
