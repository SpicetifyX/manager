import { ipcMain, IpcMainEvent } from "electron";
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
import { spicetifyCommand } from "../utils/spicetifyCommand";
import { getSpicetifyExec } from "../utils/paths";

ipcMain.on("start-install", async (event: IpcMainEvent) => {
  const sendOutput = (data: string) => {
    event.sender.send("spicetify-command-output", data);
  };

  try {
    const spicetifyExec = getSpicetifyExec();

    await spicetifyCommand(spicetifyExec, ["config", "always_enable_devtools", "1"]);

    await spicetifyCommand(spicetifyExec, ["config", "current_theme", "SpicetifyX"]);
    await spicetifyCommand(spicetifyExec, ["config", "extensions", "adblock.js"]);
    await spicetifyCommand(spicetifyExec, ["config", "color_scheme", "main"]);
    await spicetifyCommand(spicetifyExec, ["backup", "apply"], sendOutput);

    let spotifyPath;
    if (os.platform() === "win32") {
      spotifyPath = path.join(process.env.APPDATA!, "Spotify");
    } else {
      spotifyPath = path.join(os.homedir(), "Library", "Application Support", "Spotify");
    }
    await fs.writeFile(path.join(spotifyPath, ".spicetify"), "");

    event.sender.send("install-complete", { success: true });
  } catch (err) {
    console.error("Failed to install spicetify", err);
    event.sender.send("install-complete", {
      success: false,
      error: (err as Error).message,
    });
  }
});
