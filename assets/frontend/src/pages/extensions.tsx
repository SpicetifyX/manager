import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { FaDownload } from "react-icons/fa";
import { useEffect, useState } from "react";
import * as backend from "../../wailsjs/go/app/App";
import { app } from "../../wailsjs/go/models";

export default function ExtensionsPage() {
  const [loading, setLoading] = useState(true);
  const [extensions, setExtensions] = useState<app.AddonInfo[]>([]);

  useEffect(() => {
    (async () => {
      const resp = await backend.GetInstalledExtensions();
      setExtensions(resp);
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
              <h1 className="text-2xl font-bold text-white">Installed Addons</h1>
              <p className="text-[#a0a0a0]">Manage your Spicetify extensions.</p>
            </div>
            <Link
              to={"/extensions/marketplace"}
              className="flex h-8 w-fit items-center gap-2 rounded-full bg-[#d63c6a] px-4 py-2 text-sm font-semibold whitespace-nowrap text-white transition-all duration-200 hover:bg-[#c52c5a] active:bg-[#b51c4a]"
            >
              Browse marketplace
              <FaDownload />
            </Link>
          </div>

          {loading && <p className="text-[#a0a0a0]">Loading extensions...</p>}

          {!loading && (
            <div className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
              {extensions.length > 0 ? (
                extensions.map((extension) => (
                  <span>{JSON.stringify(extension)}</span>
                  // <Addon
                  //   key={addon.id}
                  //   name={addon.name}
                  //   description={addon.description}
                  //   isEnabled={addon.isEnabled}
                  //   onToggle={handleToggleAddon}
                  //   onDelete={handleDeleteAddon}
                  //   preview={addon.preview ? addon.preview : undefined}
                  //   isToggling={togglingId === addon.addonFileName}
                  //   addonFileName={addon.addonFileName}
                  //   authors={addon.authors}
                  //   tags={addon.tags}
                  // />
                ))
              ) : (
                <p className="text-[#a0a0a0]">No extensions found.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
