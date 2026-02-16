import { ipcMain } from "electron";

ipcMain.handle(
  "get-theme-asset-path",
  async (_, assetPathInput: string): Promise<string> => {
    try {
      if (
        assetPathInput.startsWith("http://") ||
        assetPathInput.startsWith("https://")
      ) {
        return assetPathInput;
      }

      const assetPath = assetPathInput;
      const addonAssetUrl = `theme-asset://${assetPath.replace(/\\/g, "/")}`;
      return addonAssetUrl;
    } catch (error) {
      console.error(
        `[get-theme-asset-path] Failed to get asset path for ${assetPathInput}:`,
        error,
      );
      return "";
    }
  },
);
