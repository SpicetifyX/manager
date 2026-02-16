import { ipcMain } from "electron";
import { installSpicetify } from "../utils/installSpicetify";
import { getSpicetifyxDir } from "../utils/paths";

ipcMain.handle("install-spicetify-binary", async () => {
  const spicetifyxDir = getSpicetifyxDir();
  await installSpicetify(spicetifyxDir);
});
