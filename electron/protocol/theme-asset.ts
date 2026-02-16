import { net } from "electron";
import path from "node:path";
import { pathToFileURL } from "node:url";

export async function handleThemeAsset(request: Request) {
  const assetPath = decodeURIComponent(
    request.url.slice("theme-asset://".length),
  );
  const fullPath = path.join(process.env.APP_PATH, "themes", assetPath);
  return net.fetch(pathToFileURL(fullPath).toString());
}
