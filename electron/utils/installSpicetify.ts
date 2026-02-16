import fs from "node:fs/promises";
import { getLatestSpicetifyReleaseArchive } from "./getLatestSpicetifyReleaseArchive";
import { tmpdir } from "node:os";
import { unzipSync } from "fflate/node";
import * as tar from "tar";
import path from "node:path";
import os from "node:os";

export async function installSpicetify(newPath: string) {
  try {
    await fs.access(newPath);
    console.log(`Successfully accessed ${newPath}`);

    if ((await fs.readdir(newPath)).includes(os.platform() === "win32" ? "spicetify.exe" : "spicetify")) {
      console.log("Spicetify already installed, skipping installation");
      return;
    }
  } catch {
    await fs.mkdir(newPath, { recursive: true });
  }

  const ARCHIVE_URL = await getLatestSpicetifyReleaseArchive();
  if (!ARCHIVE_URL) {
    throw new Error("Could not find latest release archive for spicetify/cli");
  }

  const tempDir = await fs.mkdtemp(path.join(tmpdir(), "spicetify-installer-"));
  const res = await fetch(ARCHIVE_URL);

  const archivePath = path.join(tempDir, ARCHIVE_URL.endsWith(".zip") ? "archive.zip" : "archive.tar.gz");

  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(archivePath, buf);

  console.log("Saved archive:", archivePath);
  console.log("Extracting...");

  if (archivePath.endsWith(".zip")) {
    const zipData = await fs.readFile(archivePath);
    const unzipped = unzipSync(new Uint8Array(zipData));

    for (const [name, data] of Object.entries(unzipped)) {
      const filePath = path.join(tempDir, name);

      if (name.endsWith("/")) {
        await fs.mkdir(filePath, { recursive: true });
        continue;
      }

      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, Buffer.from(data));
    }
  } else {
    await tar.x({
      file: archivePath,
      cwd: tempDir,
    });
  }

  await fs.rm(archivePath, { force: true });

  console.log("Copying to:", newPath);

  await fs.cp(tempDir, newPath, {
    recursive: true,
    force: true,
  });

  console.log("Extracted to:", newPath);
}
