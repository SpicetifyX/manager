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

ipcMain.handle("install-spicetify-extension", async (_, ext: CardItem) => {
  try {
    const spicetifyFolderPath = await getSpicetifyFolderPath();
    const extensionsFolderPath = path.join(spicetifyFolderPath, "Extensions");
    const spicetifyxConfigFolderPath = await getSpicetifyConfigFolderPath();
    const installedExtensionsConfigPath = path.join(
      spicetifyxConfigFolderPath,
      "config.json",
    );

    await fs.mkdir(extensionsFolderPath, { recursive: true });
    await fs.mkdir(spicetifyxConfigFolderPath, { recursive: true });

    const extensionFileName = path.basename(ext.extensionURL);
    const destinationPath = path.join(extensionsFolderPath, extensionFileName);

    const response = await axios.get(ext.extensionURL, {
      responseType: "arraybuffer",
    });
    await fs.writeFile(destinationPath, response.data);

    let installedExtensions: { [key: string]: CardItem } = {};
    try {
      const configContent = await fs.readFile(
        installedExtensionsConfigPath,
        "utf-8",
      );
      installedExtensions = JSON.parse(configContent);
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        console.error("Error reading installed extensions config:", error);
      }
    }

    const storageKey = ext.user + "/" + ext.repo + "/" + ext.name;
    installedExtensions[storageKey] = ext;
    console.log(
      `[install-spicetify-extension] Storing extension. ext.name: "${ext.name}", Generated key: "${storageKey}"`,
    );
    await fs.writeFile(
      installedExtensionsConfigPath,
      JSON.stringify(installedExtensions, null, 2),
    );

    const spicetifyExecPath = path.join(os.homedir(), ".spicetifyx");
    const spicetifyExec =
      os.platform() === "win32"
        ? path.join(spicetifyExecPath, "spicetify.exe")
        : path.join(spicetifyExecPath, "spicetify");

    await spicetifyCommand(spicetifyExec, [
      "config",
      "extensions",
      extensionFileName,
    ]);
    await spicetifyCommand(spicetifyExec, ["apply"]);

    return true;
  } catch (error) {
    console.error("Failed to install Spicetify extension:", error);
    return false;
  }
});
