import { Link, useLocation, Outlet } from "react-router-dom";
import { FaHome, FaPuzzlePiece, FaPalette, FaAppStore, FaFlag, FaCog } from "react-icons/fa";
import PendingChangesBar from "./PendingChangesBar";
import { SpicetifyProvider } from "../context/SpicetifyContext";
import { useState, useEffect } from "react";
import * as backend from "../../wailsjs/go/app/App";

export default function Layout() {
  const location = useLocation();
  const activeTab = location.pathname.split("/")[1] || "dashboard";

  const [addonsDirty, setAddonsDirty] = useState(false);
  const [themesDirty, setThemesDirty] = useState(false);
  const [appsDirty, setAppsDirty] = useState(false);
  const hasPendingChanges = addonsDirty || themesDirty || appsDirty;

  const [resetKey, setResetKey] = useState(0);
  const [snapshotKey, setSnapshotKey] = useState(0);

  useEffect(() => {
    // Reset window size when leaving themes tab
    if (activeTab !== "themes") {
      backend.SetWindowMaxSize(950, 640);
      backend.SetWindowMinSize(950, 640);
      backend.SetWindowSize(950, 640);
    }
  }, [activeTab]);

  return (
    <SpicetifyProvider>
      <div className="flex h-full w-full flex-1 overflow-hidden">
        <div className="flex w-16 flex-col items-center bg-main p-4">
          <Link
            to="/dashboard"
            className={`flex items-center justify-center rounded-full px-3 py-3 ${activeTab === "dashboard" ? "bg-brand text-white" : "text-[#a0a0a0] hover:bg-highlight"}`}
          >
            <FaHome size={20} />
          </Link>
          <Link
            to="/marketplace/addons"
            className={`mt-2 flex items-center justify-center rounded-full px-3 py-3 ${activeTab === "marketplace" && location.pathname.includes("addons") ? "bg-brand text-white" : "text-[#a0a0a0] hover:bg-highlight"}`}
          >
            <FaPuzzlePiece size={20} />
          </Link>
          <Link
            to="/marketplace/themes"
            className={`mt-2 flex items-center justify-center rounded-full px-3 py-3 ${activeTab === "marketplace" && location.pathname.includes("themes") ? "bg-brand text-white" : "text-[#a0a0a0] hover:bg-[#2a2a2a]"}`}
          >
            <FaPalette size={20} />
          </Link>
          <Link
            to="/marketplace/apps"
            className={`mt-2 flex items-center justify-center rounded-full px-3 py-3 ${activeTab === "marketplace" && location.pathname.includes("apps") ? "bg-brand text-white" : "text-[#a0a0a0] hover:bg-[#2a2a2a]"}`}
          >
            <FaAppStore size={20} />
          </Link>
          <div className="mt-auto flex flex-col gap-2">
            <Link
              to="/submit"
              className={`flex items-center justify-center rounded-full px-3 py-3 ${activeTab === "submit" ? "bg-brand text-white" : "text-[#a0a0a0] hover:bg-[#2a2a2a]"}`}
            >
              <FaFlag size={20} />
            </Link>
            <Link
              to="/settings"
              className={`flex items-center justify-center rounded-full px-3 py-3 ${activeTab === "settings" ? "bg-brand text-white" : "text-[#a0a0a0] hover:bg-[#2a2a2a]"}`}
            >
              <FaCog size={20} />
            </Link>
          </div>
        </div>
        <div className="relative flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden flex flex-col">
            <Outlet context={{ 
                setAddonsDirty, 
                setThemesDirty, 
                setAppsDirty, 
                resetKey, 
                snapshotKey 
            }} />
          </div>
          {hasPendingChanges && (
            <PendingChangesBar
              onApplied={() => {
                setAddonsDirty(false);
                setThemesDirty(false);
                setAppsDirty(false);
                setSnapshotKey((k) => k + 1);
              }}
              onReset={() => setResetKey((k) => k + 1)}
            />
          )}
        </div>
      </div>
    </SpicetifyProvider>
  );
}
