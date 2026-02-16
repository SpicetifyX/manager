import os from "node:os";

export async function getLatestSpicetifyReleaseArchive(): Promise<
  string | null
> {
  const apiUrl = "https://api.github.com/repos/spicetify/cli/releases/latest";
  const res = await fetch(apiUrl);

  if (!res.ok) return null;

  const release = (await res.json()) as {
    assets: [{ name: string; browser_download_url: string }];
  };
  const platform = os.platform();
  const arch = os.arch();

  let osName: string;

  if (platform === "win32") osName = "windows";
  else if (platform === "darwin") osName = "darwin";
  else osName = "linux";

  console.log(osName, arch, platform);

  const archStr: string = arch;

  let asset = release.assets.find(
    (a) => a.name.includes(osName) && a.name.includes(archStr),
  );
  if (!asset && archStr === "x64") {
    asset = release.assets.find(
      (a) => a.name.includes(osName) && a.name.includes("amd64"),
    );
  }

  return asset ? asset.browser_download_url : null;
}
