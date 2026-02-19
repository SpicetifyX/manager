import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { FaDownload } from "react-icons/fa";
import { useEffect, useState } from "react";
import * as backend from "../../wailsjs/go/app/App";
import { app } from "../../wailsjs/go/models";
import Theme from "../components/Theme";
import { useAppStore } from "../hooks";

export default function ThemesPage() {
  const [loading, setLoading] = useState(true);
  const [themes, setThemes] = useState<app.ThemeInfo[]>([]);
  const appState = useAppStore();

  useEffect(() => {
    (async () => {
      setThemes(appState.themes);
      if (appState.themes.length > 0) {
        setLoading(false);
      }

      const resp = await backend.GetSpicetifyThemes();

      setThemes(resp);
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
              <h1 className="text-2xl font-bold text-white">Installed Themes</h1>
              <p className="text-[#a0a0a0]">Manage your Spicetify themes.</p>
            </div>
            <Link
              to={"/themes/marketplace"}
              className="flex h-8 w-fit items-center gap-2 rounded-full bg-[#d63c6a] px-4 py-2 text-sm font-semibold whitespace-nowrap text-white transition-all duration-200 hover:bg-[#c52c5a] active:bg-[#b51c4a]"
            >
              Browse marketplace
              <FaDownload />
            </Link>
          </div>

          {loading && <p className="text-[#a0a0a0]">Loading themes...</p>}

          {!loading && (
            <div className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
              {themes.length > 0 ? (
                themes.map((theme, index) => <Theme key={index} theme={theme} />)
              ) : (
                <p className="text-[#a0a0a0]">No themes found.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
