import { ipcMain } from "electron";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

ipcMain.handle(
  "install-extension",
  async (
    _event,
    { fileName, content }: { fileName: string; content: string },
  ) => {
    try {
      const extensionsPath = join(homedir(), ".spicetifyx", "Extensions");

      try {
        mkdirSync(extensionsPath, { recursive: true });
      } catch (err) {
        console.log(err);
      }

      const filePath = join(extensionsPath, fileName);

      writeFileSync(filePath, content, "utf-8");

      return { success: true, filePath };
    } catch (error: any) {
      console.error("Error installing extension:", error);
      throw new Error(error.message || "Failed to install extension");
    }
  },
);
