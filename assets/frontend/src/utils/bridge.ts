import { EventsOn, EventsOff } from "../../wailsjs/runtime/runtime";

// Wails EventsOn only supports one listener per event name — calling it twice
// silently overwrites the first. This multi-subscriber wrapper fixes that by
// maintaining a Set of callbacks and wiring a single Wails listener per event.
type AnyCallback = (...args: any[]) => void;
const subscribers = new Map<string, Set<AnyCallback>>();

function subscribe<T extends AnyCallback>(event: string, cb: T): () => void {
  if (!subscribers.has(event)) {
    subscribers.set(event, new Set());
    EventsOn(event, (...args: any[]) => {
      subscribers.get(event)?.forEach((fn) => fn(...args));
    });
  }
  subscribers.get(event)!.add(cb);
  return () => {
    const set = subscribers.get(event);
    if (!set) return;
    set.delete(cb);
    if (set.size === 0) {
      subscribers.delete(event);
      EventsOff(event);
    }
  };
}

const onInstallComplete = (cb: (event: null, result: { success: boolean; error?: string }) => void) =>
  subscribe("install-complete", (result: { success: boolean; error?: string }) => cb(null, result));

const onRestoreComplete = (cb: (event: null, result: { success: boolean; error?: string }) => void) =>
  subscribe("restore-complete", (result: { success: boolean; error?: string }) => cb(null, result));

const onCommandOutput = (cb: (event: null, data: string) => void) =>
  subscribe("spicetify-command-output", (data: string) => cb(null, data));

export { onCommandOutput, onInstallComplete, onRestoreComplete };
