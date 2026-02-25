import { useEffect, useState, useRef, useCallback } from "react";
import { FaDiscord, FaFolder, FaTrashAlt, FaExternalLinkAlt, FaGithub, FaArrowUp } from "react-icons/fa";
import * as backend from "../../wailsjs/go/app/App";

interface AppSettings {
  discordRpc: boolean;
  closeToTray: boolean;
  checkUpdatesOnLaunch: boolean;
}

const DEFAULTS: AppSettings = {
  discordRpc: true,
  closeToTray: false,
  checkUpdatesOnLaunch: true,
};

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [appVersion, setAppVersion] = useState<string>("");
  const [cacheCleared, setCacheCleared] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{ available: boolean; version: string; url: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showScrollbar = useCallback(() => {
    scrollRef.current?.classList.add("scrollbar-visible");
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      scrollRef.current?.classList.remove("scrollbar-visible");
    }, 1200);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => showScrollbar();
    const onMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      if (e.clientX >= rect.right - 12) showScrollbar();
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("mousemove", onMouseMove);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [showScrollbar]);

  useEffect(() => {
    (async () => {
      try {
        const [fetched, version] = await Promise.all([backend.GetSettings(), backend.GetAppVersion()]);
        const merged = { ...DEFAULTS, ...fetched };
        setSettings(merged);
        setAppVersion(version);
        if (merged.checkUpdatesOnLaunch) {
          const info = await (backend as any).CheckForUpdates();
          if (info?.available) setUpdateInfo(info);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateSetting = async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await backend.UpdateSettings({ [key]: value });
  };

  const handleClearCache = () => {
    window.sessionStorage.clear();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2500);
  };

  const handleOpenConfigFolder = () => {
    backend.OpenConfigFolder();
  };

  const handleOpenDiscord = () => {
    backend.OpenExternalLink("https://discord.gg/DqYSqeJz2M");
  };

  const handleOpenGitHub = () => {
    backend.OpenExternalLink("https://github.com/SpicetifyX");
  };

  if (loading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center bg-[#171b20]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2a2a2a] border-t-[#d63c6a]"></div>
          <p className="text-sm text-[#a0a0a0]">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="settings-scrollbar flex h-full flex-1 flex-col overflow-y-auto overflow-x-hidden bg-[#171b20] p-5">
      <div className="mb-4 border-b border-[#1e2228] pb-4">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-[#a0a0a0]">Configure SpicetifyX Manager preferences</p>
      </div>

      {updateInfo?.available && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-[#d63c6a]/30 bg-[#d63c6a]/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <FaArrowUp className="text-[#d63c6a]" size={13} />
            <p className="text-sm text-white">
              Update available — <span className="font-semibold text-[#d63c6a]">{updateInfo.version}</span>
            </p>
          </div>
          <button
            onClick={() => backend.OpenExternalLink(updateInfo.url)}
            className="flex items-center gap-1.5 rounded bg-[#d63c6a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#c52c5a] transition-colors"
          >
            Download <FaExternalLinkAlt size={10} />
          </button>
        </div>
      )}

      <div className="flex flex-1 flex-col space-y-4">
        <div className="rounded-lg border border-[#2a2a2a] bg-[#121418] p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#d63c6a]">General</p>
          <div className="space-y-4">
            <ToggleSetting
              label="Discord Rich Presence"
              description="Show SpicetifyX activity on your Discord profile"
              checked={settings.discordRpc}
              onChange={(v) => updateSetting("discordRpc", v)}
            />
            <ToggleSetting
              label="Close to System Tray"
              description="Minimize to the system tray instead of quitting when you close the window"
              checked={settings.closeToTray}
              onChange={(v) => updateSetting("closeToTray", v)}
            />
            <ToggleSetting
              label="Check for Updates on Launch"
              description="Automatically check for SpicetifyX updates when the app starts"
              checked={settings.checkUpdatesOnLaunch}
              onChange={(v) => updateSetting("checkUpdatesOnLaunch", v)}
            />
          </div>
        </div>

        <div className="rounded-lg border border-[#2a2a2a] bg-[#121418] p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#d63c6a]">Actions</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-[#0a0c0f] p-3">
              <div>
                <p className="text-sm font-medium text-white">Clear Marketplace Cache</p>
                <p className="text-xs text-[#666]">Force re-fetch all community data on next browse</p>
              </div>
              <button
                onClick={handleClearCache}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${cacheCleared ? "bg-green-600 text-white" : "bg-[#2a2a2a] text-white hover:bg-[#3a3a3a] active:scale-95"
                  }`}
              >
                <FaTrashAlt className="h-3 w-3" />
                {cacheCleared ? "Cleared!" : "Clear Cache"}
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-[#0a0c0f] p-3">
              <div>
                <p className="text-sm font-medium text-white">Open Config Folder</p>
                <p className="text-xs text-[#666]">Open the Spicetify configuration directory in File Explorer</p>
              </div>
              <button
                onClick={handleOpenConfigFolder}
                className="flex items-center gap-2 rounded-lg bg-[#2a2a2a] px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#3a3a3a] active:scale-95"
              >
                <FaFolder className="h-3 w-3" />
                Open Folder
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[#2a2a2a] bg-[#121418] p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#d63c6a]">About</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-[#0a0c0f] p-3">
              <span className="text-sm text-[#a0a0a0]">Version</span>
              <span className="text-sm font-semibold text-white">{appVersion || "—"}</span>
            </div>
            <button
              onClick={handleOpenDiscord}
              className="flex w-full items-center justify-between rounded-lg bg-[#0a0c0f] p-3 transition-colors hover:bg-[#161a1f]"
            >
              <div className="flex items-center gap-3">
                <FaDiscord className="h-5 w-5 text-[#5865F2]" />
                <div className="text-left">
                  <p className="text-sm font-medium text-white">Join our Discord</p>
                  <p className="text-xs text-[#666]">Get support, share feedback, and stay updated</p>
                </div>
              </div>
              <FaExternalLinkAlt className="h-3 w-3 text-[#666]" />
            </button>
            <button
              onClick={handleOpenGitHub}
              className="flex w-full items-center justify-between rounded-lg bg-[#0a0c0f] p-3 transition-colors hover:bg-[#161a1f]"
            >
              <div className="flex items-center gap-3">
                <FaGithub className="h-5 w-5 text-white" />
                <div className="text-left">
                  <p className="text-sm font-medium text-white">GitHub Repository</p>
                  <p className="text-xs text-[#666]">View source code, report issues, and contribute</p>
                </div>
              </div>
              <FaExternalLinkAlt className="h-3 w-3 text-[#666]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-[#0a0c0f] p-3">
      <div className="mr-4">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-[#666]">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 ${checked ? "bg-[#d63c6a]" : "bg-[#2a2a2a]"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"
            }`}
        />
      </button>
    </div>
  );
}
