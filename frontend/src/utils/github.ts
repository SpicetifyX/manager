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
