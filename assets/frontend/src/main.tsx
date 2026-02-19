import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route, redirect } from "react-router-dom";
import DashboardPage from "./pages/dashboard";
import Titlebar from "./components/Titlebar";
import InstallPage from "./pages/install";
import * as backend from "../wailsjs/go/app/App";
import "./style.css";
import ExtensionsPage from "./pages/extensions";
import ThemesPage from "./pages/themes";
import AppsPage from "./pages/apps";
import SettingsPage from "./pages/settings";
import MarketplaceExtensions from "./pages/marketplace/extensions";
import MarketplaceThemes from "./pages/marketplace/themes";

function App() {
  useEffect(() => {
    (async () => {
      const resp = await backend.CheckInstallation();

      if (!resp.patched || !resp.spicetify) {
        redirect("/install");
      }
    })();
  }, []);

  return (
    <HashRouter basename="/">
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#171b20]">
        <Titlebar />
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/install" element={<InstallPage />} />
          <Route path="/extensions" element={<ExtensionsPage />} />
          <Route path="/extensions/marketplace" element={<MarketplaceExtensions />} />
          <Route path="/themes/marketplace" element={<MarketplaceThemes />} />
          <Route path="/themes" element={<ThemesPage />} />
          <Route path="/apps" element={<AppsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
