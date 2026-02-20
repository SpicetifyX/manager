import { EventsOn, EventsOff } from "../../wailsjs/runtime/runtime";

const onInstallComplete = (cb: (event: any, result: { success: boolean; error?: string }) => void) => {
  EventsOn("install-complete", (result: { success: boolean; error?: string }) => cb(null, result));
  return () => EventsOff("install-complete");
};

const onRestoreComplete = (cb: (event: any, result: { success: boolean; error?: string }) => void) => {
  EventsOn("restore-complete", (result: { success: boolean; error?: string }) => cb(null, result));
  return () => EventsOff("restore-complete");
};

const onCommandOutput = (cb: (event: any, data: string) => void) => {
  EventsOn("spicetify-command-output", (data: string) => cb(null, data));
  return () => EventsOff("spicetify-command-output");
};

export { onCommandOutput, onInstallComplete, onRestoreComplete };
