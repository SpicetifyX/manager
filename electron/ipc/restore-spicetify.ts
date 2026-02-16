import { ipcMain, IpcMainEvent } from "electron";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { spicetifyCommand } from "../utils/spicetifyCommand";
import { getSpicetifyExec, getSpicetifyxDir } from "../utils/paths";

const tryRm = async (p: string, label: string) => {
  try {
    await fs.rm(p, { force: true, recursive: true });
    console.log(`[restore-spicetify] Removed ${label}: ${p}`);
  } catch (e) {
    console.warn(`[restore-spicetify] Could not remove ${label}: ${p}`, e);
  }
};

ipcMain.on("start-restore", async (event: IpcMainEvent) => {
  const sendOutput = (data: string) => {
    event.sender.send("spicetify-command-output", data);
  };

  try {
    const spicetifyxPath = getSpicetifyxDir();
    const spicetifyExec = getSpicetifyExec();

    try {
      await spicetifyCommand(spicetifyExec, ["restore", "backup"], sendOutput);
    } catch (err) {
      console.warn(
        "[restore-spicetify] restore backup failed, continuing with cleanup:",
        err,
      );
      sendOutput("Warning: restore backup failed, cleaning up files...\n");
    }

    if (os.platform() === "win32") {
      const appdata = process.env.APPDATA!;
      const localAppdata =
        process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");

      await tryRm(path.join(appdata, "Spicetify"), "APPDATA/Spicetify");
      await tryRm(path.join(appdata, "spicetify"), "APPDATA/spicetify");
      await tryRm(
        path.join(localAppdata, "Spicetify"),
        "LOCALAPPDATA/Spicetify",
      );
      await tryRm(
        path.join(localAppdata, "spicetify"),
        "LOCALAPPDATA/spicetify",
      );
      await tryRm(
        path.join(appdata, "Spotify", ".spicetify"),
        "Spotify .spicetify marker",
      );
    } else {
      await tryRm(
        path.join(os.homedir(), ".config", "spicetify"),
        "~/.config/spicetify",
      );
      await tryRm(
        path.join(
          os.homedir(),
          "Library",
          "Application Support",
          "Spotify",
          ".spicetify",
        ),
        "Spotify .spicetify marker",
      );
      await tryRm(
        path.join(os.homedir(), ".local", "state", "spicetify"),
        "~/.local/state/spicetify",
      );
      await tryRm(
        path.join(os.homedir(), ".local", "share", "spicetify"),
        "~/.local/share/spicetify",
      );
    }

    await tryRm(spicetifyxPath, path.join(os.homedir(), ".spicetifyx"));

    event.sender.send("restore-complete", { success: true });
  } catch (err) {
    console.error("[restore-spicetify] Failed to restore spicetify", err);
    event.sender.send("restore-complete", {
      success: false,
      error: (err as Error).message,
    });
  }
});
