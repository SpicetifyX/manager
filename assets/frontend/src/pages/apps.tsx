import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { FaDownload } from "react-icons/fa";
import { useEffect, useState } from "react";
import * as backend from "../../wailsjs/go/app/App";
import { app } from "../../wailsjs/go/models";
import { useAppStore } from "../hooks";
import App from "../components/App";

export default function AppsPage() {
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<app.AppInfo[]>([]);
  const appState = useAppStore();

  useEffect(() => {
    (async () => {
      setApps(appState.apps);
      if (appState.extensions.length > 0) {
        setLoading(false);
      }

      const resp = await backend.GetSpicetifyApps();

      setApps(resp);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="flex h-full w-full flex-1">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="flex h-full flex-col p-4">
          <div className="mb-6 flex w-full items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Installed Apps</h1>
              <p className="text-[#a0a0a0]">Manage your Spicetify apps.</p>
            </div>
            <Link
              to={"/apps/marketplace"}
              className="flex h-8 w-fit items-center gap-2 rounded-full bg-[#d63c6a] px-4 py-2 text-sm font-semibold whitespace-nowrap text-white transition-all duration-200 hover:bg-[#c52c5a] active:bg-[#b51c4a]"
            >
              Browse marketplace
              <FaDownload />
            </Link>
          </div>

          {loading && <p className="text-[#a0a0a0]">Loading apps...</p>}

          {!loading && (
            <div className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
              {apps.length > 0 ? apps.map((app, index) => <App key={index} app={app} />) : <p className="text-[#a0a0a0]">No apps found.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
