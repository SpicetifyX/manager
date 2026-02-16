import { ipcMain } from "electron";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { getSpicetifyExec, getConfigFilePath } from "../utils/paths";

const fileExists = async (p: string) =>
  fs
    .access(p)
    .then(() => true)
    .catch(() => false);

ipcMain.handle("check-installation", async () => {
  let spotifyPath: string;
  let alreadyPatched: string;

  if (os.platform() === "win32") {
    spotifyPath = path.join(process.env.APPDATA!, "Spotify");
    alreadyPatched = path.join(spotifyPath, ".spicetify");
  } else {
    spotifyPath = path.join(
      os.homedir(),
      "Library",
      "Application Support",
      "Spotify",
    );
    alreadyPatched = path.join(spotifyPath, ".spicetify");
  }

  const spotify_installed = await fileExists(spotifyPath);
  const binary_exists = await fileExists(getSpicetifyExec());
  const config_exists = await fileExists(getConfigFilePath());
  const already_patched = await fileExists(alreadyPatched);
  const spicetify_installed = binary_exists && config_exists;

  console.log("[check-installation]", {
    spotify_installed,
    spicetify_installed,
    already_patched,
    binary_exists,
    config_exists,
  });

  return { spotify_installed, spicetify_installed, already_patched };
});
