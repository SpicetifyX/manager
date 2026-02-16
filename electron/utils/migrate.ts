import fs from "node:fs/promises";
import path from "node:path";
import { AddonManifest } from "../../src/types/addon";
import { ThemeManifestEntry } from "../../src/types/theme";
import { getThemesDir, getExtensionsDir, getCustomAppsDir } from "./paths";
import { copyDirRecursive } from "./fs-helpers";

export async function migrateThemes() {
  const themesManifestPath = path.join(
    process.env.APP_PATH,
    "themes",
    "manifest.json",
  );

  let themesManifest: ThemeManifestEntry[] = [];
  try {
    const manifestContent = await fs.readFile(themesManifestPath, "utf-8");
    themesManifest = JSON.parse(manifestContent);
  } catch (error) {
    console.error("Failed to read or parse themes/manifest.json:", error);
  }

  for (const theme of themesManifest) {
    const spicetifyThemesPath = getThemesDir();

    await fs.mkdir(spicetifyThemesPath, { recursive: true });

    const themeDirName = path.dirname(
      theme.usercss ||
        theme.schemes ||
        (theme.include && theme.include[0]) ||
        theme.name,
    );
    const destThemeDirPath = path.join(spicetifyThemesPath, themeDirName);
    await fs.mkdir(destThemeDirPath, { recursive: true });

    const copyFileIfExist = async (relativePath: string | undefined) => {
      if (relativePath) {
        const sourcePath = path.join(
          process.env.APP_PATH,
          "themes",
          relativePath,
        );
        const destPath = path.join(spicetifyThemesPath, relativePath);
        try {
          await fs.copyFile(sourcePath, destPath);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            console.warn(
              `Theme file ${relativePath} not found at ${sourcePath}, skipping.`,
            );
          } else {
            console.error(`Failed to copy theme file ${relativePath}:`, error);
          }
        }
      }
    };

    await copyFileIfExist(theme.usercss);
    await copyFileIfExist(theme.schemes && theme.schemes[0]);
    if (theme.include) {
      for (const includePath of theme.include) {
        await copyFileIfExist(includePath);
      }
    }
  }
}

export async function migrateExtensions() {
  const spicetifyExtensionsPath = getExtensionsDir();

  await fs.mkdir(spicetifyExtensionsPath, { recursive: true });

  const extensionsManifestPath = path.join(
    process.env.APP_PATH,
    "extensions",
    "manifest.json",
  );

  let extensionsManifest: AddonManifest[] = [];
  try {
    const manifestContent = await fs.readFile(extensionsManifestPath, "utf-8");
    extensionsManifest = JSON.parse(manifestContent);
  } catch (error) {
    console.error("Failed to read or parse extensions/manifest.json:", error);
  }

  for (const ext of extensionsManifest) {
    const sourceFilePath = path.join(
      process.env.APP_PATH,
      "extensions",
      ext.main,
    );
    const destFileName = path.basename(ext.main);
    const destFilePath = path.join(spicetifyExtensionsPath, destFileName);
    try {
      await fs.copyFile(sourceFilePath, destFilePath);
    } catch (error) {
      console.error(`Failed to copy extension ${ext.main}:`, error);
    }
  }
}

export async function migrateApps() {
  const spicetifyCustomAppsPath = getCustomAppsDir();

  await fs.mkdir(spicetifyCustomAppsPath, { recursive: true });

  const appsSrcDir = path.join(process.env.APP_PATH, "apps");

  let appFolders: string[];
  try {
    const entries = await fs.readdir(appsSrcDir, { withFileTypes: true });
    appFolders = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch (error) {
    console.warn("[migrateApps] No apps directory found, skipping:", error);
    return;
  }

  for (const folder of appFolders) {
    const srcAppDir = path.join(appsSrcDir, folder);
    const destAppDir = path.join(spicetifyCustomAppsPath, folder);
    await fs.mkdir(destAppDir, { recursive: true });

    try {
      await copyDirRecursive(srcAppDir, destAppDir);
      console.log(`[migrateApps] Copied app "${folder}" to ${destAppDir}`);
    } catch (error) {
      console.error(`[migrateApps] Failed to copy app "${folder}":`, error);
    }
  }
}
