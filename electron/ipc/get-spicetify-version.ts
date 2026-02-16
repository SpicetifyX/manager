import { ipcMain } from "electron";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import { getSpicetifyExec, getSpicetifyConfigDir } from "../utils/paths";

ipcMain.handle("get-spicetify-version", async () => {
  try {
    await fs.access(getSpicetifyConfigDir());

    const spicetifyExec = getSpicetifyExec();

    try {
      const output = await new Promise<string>((resolve) => {
        const proc = spawn(spicetifyExec, ["-v"], {
          stdio: "pipe",
          windowsHide: true,
          detached: true,
        });
        let result = "";
        proc.stdout?.on("data", (data) => {
          result += data.toString();
        });
        proc.on("close", () => {
          resolve(result.trim());
        });
        proc.on("error", () => {
          resolve("Unknown");
        });
      });
      return output || "Unknown";
    } catch (err) {
      console.error("Failed to get Spicetify version", err);
      return "Unknown";
    }
  } catch (e) {
    console.log(e);
    return "Unknown";
  }
});
