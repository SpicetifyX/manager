import { ipcMain } from "electron";
import path from "path";
import fs from "fs/promises";
import axios from "axios";
import os from "os";
import { CardItem } from "../../src/utils/marketplace-types";
import {
  getSpicetifyFolderPath,
  getSpicetifyConfigFolderPath,
  spicetifyCommand,
} from "../utils/spicetifyCommand";

ipcMain.handle("install-spicetify-theme", async (_, theme: CardItem) => {
  try {
    const spicetifyFolderPath = await getSpicetifyFolderPath();
    const themesFolderPath = path.join(spicetifyFolderPath, "Themes");
    const spicetifyxConfigFolderPath = await getSpicetifyConfigFolderPath();
    const installedThemesConfigPath = path.join(
      spicetifyxConfigFolderPath,
      "themes-config.json",
    );

    await fs.mkdir(themesFolderPath, { recursive: true });
    await fs.mkdir(spicetifyxConfigFolderPath, { recursive: true });

    const themeDirName = theme.repo;
    const destinationThemeFolderPath = path.join(
      themesFolderPath,
      themeDirName,
    );
    await fs.mkdir(destinationThemeFolderPath, { recursive: true });

    if (theme.cssURL) {
      const cssFileName = "user.css";
      const destinationCssPath = path.join(
        destinationThemeFolderPath,
        cssFileName,
      );
      const cssResponse = await axios.get(theme.cssURL, {
        responseType: "arraybuffer",
      });
      await fs.writeFile(destinationCssPath, cssResponse.data);
    }

    if (theme.schemesURL) {
      const colorIniFileName = "color.ini";
      const destinationColorIniPath = path.join(
        destinationThemeFolderPath,
        colorIniFileName,
      );
      const colorIniResponse = await axios.get(theme.schemesURL, {
        responseType: "arraybuffer",
      });
      await fs.writeFile(destinationColorIniPath, colorIniResponse.data);
    }

    let installedThemes: { [key: string]: CardItem } = {};
    try {
      const configContent = await fs.readFile(
        installedThemesConfigPath,
        "utf-8",
      );
      installedThemes = JSON.parse(configContent);
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        console.error("Error reading installed themes config:", error);
      }
    }

    const storageKey = theme.user + "/" + theme.repo + "/" + theme.name;
    installedThemes[storageKey] = theme;
    console.log(
      `[install-spicetify-theme] Storing theme. theme.name: "${theme.name}", Generated key: "${storageKey}"`,
    );
    await fs.writeFile(
      installedThemesConfigPath,
      JSON.stringify(installedThemes, null, 2),
    );

    const spicetifyExecPath = path.join(os.homedir(), ".spicetifyx");
    const spicetifyExec =
      os.platform() === "win32"
        ? path.join(spicetifyExecPath, "spicetify.exe")
        : path.join(spicetifyExecPath, "spicetify");

    await spicetifyCommand(spicetifyExec, [
      "config",
      "current_theme",
      themeDirName,
    ]);
    await spicetifyCommand(spicetifyExec, ["config", "color_scheme", "base"]);
    await spicetifyCommand(spicetifyExec, ["apply"]);

    return true;
  } catch (error) {
    console.error("Failed to install Spicetify theme:", error);
    return false;
  }
});
