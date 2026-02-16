import { net } from "electron";
import path from "node:path";
import { pathToFileURL } from "node:url";

export async function handleAddonAsset(request: Request) {
  const assetPath = decodeURIComponent(
    request.url.slice("addon-asset://".length),
  );
  const fullPath = path.join(process.env.APP_PATH, "extensions", assetPath);
  return net.fetch(pathToFileURL(fullPath).toString());
}
