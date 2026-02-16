import { createConnection, Socket } from "node:net";
import { randomUUID } from "node:crypto";
import os from "node:os";
import path from "node:path";

const OPCODES = {
  HANDSHAKE: 0,
  FRAME: 1,
  CLOSE: 2,
  PING: 3,
  PONG: 4,
};

export default class DiscordRPC {
  private socket: Socket | null = null;
  private clientId: string;
  private connected = false;

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  private encode(op: number, data: any): Buffer {
    const dataStr = JSON.stringify(data);
    const dataLen = Buffer.byteLength(dataStr);
    const packet = Buffer.alloc(8 + dataLen);
    packet.writeInt32LE(op, 0);
    packet.writeInt32LE(dataLen, 4);
    packet.write(dataStr, 8, dataLen);
    return packet;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!this.connected) {
          this.socket?.destroy();
          reject(new Error("Connection timeout"));
        }
      }, 10000);

      const connectToPipe = (ipcPath: string) => {
        this.socket = createConnection(ipcPath, () => {
          console.log(`[SimpleRPC] Connected to Discord IPC at ${ipcPath}`);

          const handshake = this.encode(OPCODES.HANDSHAKE, {
            v: 1,
            client_id: this.clientId,
          });
          this.socket?.write(handshake);
        });

        this.socket.on("readable", () => {
          const data = this.socket?.read();
          if (!data) return;

          try {
            const op = data.readInt32LE(0);
            const len = data.readInt32LE(4);
            const payload = JSON.parse(data.slice(8, 8 + len).toString());

            if (
              op === OPCODES.FRAME &&
              payload.cmd === "DISPATCH" &&
              payload.evt === "READY"
            ) {
              this.connected = true;
              clearTimeout(timeout);
              console.log(
                "[SimpleRPC] Ready! Connected as:",
                payload.data.user.username,
              );
              resolve();
            }
          } catch (err) {
            console.error("[SimpleRPC] Parse error:", err);
          }
        });

        this.socket.on("error", (err) => {
          console.error(
            `[SimpleRPC] Connection error on ${ipcPath}:`,
            err.message,
          );
          this.socket?.destroy();
          reject(err);
        });
      };

      if (os.platform() === "win32") {
        connectToPipe("\\\\.\\pipe\\discord-ipc-0");
      } else {
        const discordPipePath =
          os.platform() === "darwin"
            ? path.join(
                os.homedir(),
                "Library",
                "Application Support",
                "discord",
                "ipc",
              )
            : "/tmp";
        const maxAttempts = 9;
        let found = false;
        let errors = 0;

        for (let i = 0; i <= maxAttempts; i++) {
          const ipcPath = path.join(discordPipePath, `discord-ipc-${i}`);
          const tempSocket = createConnection(ipcPath);
          tempSocket.on("connect", () => {
            tempSocket.destroy();
            if (!found) {
              found = true;
              connectToPipe(ipcPath);
            }
          });
          tempSocket.on("error", () => {
            errors++;
            if (errors > maxAttempts && !found) {
              clearTimeout(timeout);
              reject(
                new Error(
                  `Could not connect to Discord IPC after ${maxAttempts + 1} attempts.`,
                ),
              );
            }
          });
          tempSocket.unref();
        }
      }
    });
  }

  async setActivity(activity: any): Promise<void> {
    if (!this.connected || !this.socket) {
      throw new Error("Not connected");
    }

    const nonce = randomUUID();
    const frame = this.encode(OPCODES.FRAME, {
      cmd: "SET_ACTIVITY",
      args: {
        pid: process.pid,
        activity,
      },
      nonce,
    });

    this.socket.write(frame);
    console.log("[SimpleRPC] Activity set");
  }

  close() {
    this.socket?.end();
    this.connected = false;
  }
}
