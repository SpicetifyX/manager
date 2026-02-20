import { ipcMain } from "electron";
import { spicetifyCommand } from "../utils/spicetifyCommand";
import { getSpicetifyExec } from "../utils/paths";

ipcMain.handle("apply-spicetify", async (): Promise<boolean> => {
  try {
    const spicetifyExec = getSpicetifyExec();
    await spicetifyCommand(spicetifyExec, ["apply"]);
    console.log("[apply-spicetify] Applied successfully.");
    return true;
  } catch (error) {
    console.error("[apply-spicetify] Failed:", error);
    return false;
  }
});
