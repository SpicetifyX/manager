import { spawn } from "node:child_process";
import path from "path";
import os from "os";

export async function spicetifyCommand(
  exec: string,
  opts: string[],
  onData?: (data: string) => void,
  acceptCodes: number[] = [],
) {
  return new Promise<void>((resolve, reject) => {
    let output = "";

    const proc = spawn(exec, opts, {
      stdio: "pipe",
      detached: true,
      windowsHide: true,
    });

    proc.stdout.on("data", (data) => {
      const dataStr = data.toString();
      output += dataStr;
      onData?.(dataStr);
    });

    proc.stderr.on("data", (data) => {
      const dataStr = data.toString();
      output += dataStr;
      onData?.(dataStr);
    });

    proc.on("close", (code) => {
      if (code === 0 || acceptCodes.includes(code ?? -1)) {
        resolve();
      } else {
        reject(
          new Error(`${exec} exited with code ${code}. Output:\n${output}`),
        );
      }
    });

    proc.on("error", (err) => {
      console.error(`[spicetifyCommand] Process errored: ${err.message}`);
      reject(err);
    });
  });
}

export async function getSpicetifyFolderPath(): Promise<string> {
  if (process.platform === "win32") {
    return path.join(process.env.APPDATA || "", "spicetify");
  } else {
    return path.join(os.homedir(), ".config", "spicetify");
  }
}

export async function getSpicetifyConfigFolderPath(): Promise<string> {
  if (process.platform === "win32") {
    return path.join(process.env.APPDATA || "", ".spicetifyx");
  } else {
    return path.join(os.homedir(), ".spicetifyx");
  }
}
