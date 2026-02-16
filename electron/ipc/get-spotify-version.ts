import { ipcMain } from "electron";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

ipcMain.handle("get-spotify-version", async () => {
  try {
    let prefsPath;
    if (os.platform() === "win32") {
      prefsPath = path.join(process.env.APPDATA!, "Spotify", "prefs");
    } else {
      prefsPath = path.join(
        os.homedir(),
        "Library",
        "Application Support",
        "Spotify",
        "prefs",
      );
    }

    const prefsContent = await fs.readFile(prefsPath, "utf-8");

    const versionMatch = prefsContent.match(
      /app\.last-launched-version="([^"]+)"/,
    );

    if (versionMatch && versionMatch[1]) {
      console.log("Spotify version found:", versionMatch[1]);
      return versionMatch[1];
    }

    console.log("Could not extract version from prefs file");
    return "Unknown";
  } catch (err) {
    console.error("Failed to get Spotify version:", err);
    return "Unknown";
  }
});
