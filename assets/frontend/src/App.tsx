import { useEffect, useState } from "react";
import { Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import * as backend from "../wailsjs/go/app/App";
import { onInstallComplete } from "./utils/bridge";

import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import MarketplaceAddonsPage from "./pages/MarketplaceAddonsPage";
import MarketplaceThemesPage from "./pages/MarketplaceThemesPage";
import MarketplaceAppsPage from "./pages/MarketplaceAppsPage";
import SettingsPage from "./pages/SettingsPage";
import SubmitAddonPage from "./pages/SubmitAddonPage";
import CheckingInstallationPage from "./pages/CheckingInstallationPage";
import IncompatibleSpotifyPage from "./pages/IncompatibleSpotifyPage";
import OldInstallFoundPage from "./pages/OldInstallFoundPage";
import InstallWizardPage from "./pages/InstallWizardPage";
import TitleBar from "./components/TitleBar";

export default function App() {
  const [isChecking, setIsChecking] = useState(true);
  const [installStatus, setInstallStatus] = useState<null | {
    spotify_installed: boolean;
    spicetify_installed: boolean;
    already_patched: boolean;
    microsoft_store: boolean;
  }>(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  async function fetchInstallStatus() {
    setIsChecking(true);
    try {
      const status = await backend.CheckInstallation();
      const newStatus = {
        spicetify_installed: status.spicetify,
        spotify_installed: status.spotify,
        already_patched: status.patched,
        microsoft_store: status.microsoft_store,
      };
      setInstallStatus(newStatus);
      
      // Initial routing based on status
      if (newStatus.microsoft_store) {
        navigate("/error/microsoft-store", { replace: true });
      } else if (newStatus.spicetify_installed && !newStatus.already_patched) {
        navigate("/error/old-install", { replace: true });
      } else if (!newStatus.already_patched) {
        navigate("/install", { replace: true });
      } else {
        // If we are on / or any other route that doesn't make sense after install
        if (location.pathname === "/" || location.pathname === "/install" || location.pathname.startsWith("/error")) {
            navigate("/dashboard", { replace: true });
        }
      }
    } catch (error) {
      console.error("Failed to check installation status:", error);
    } finally {
      setIsChecking(false);
    }
  }

  useEffect(() => {
    fetchInstallStatus();

    const handleInstallComplete = (_event: any, { success, error }: { success: boolean; error?: string }) => {
      if (success) {
        setTimeout(() => {
          fetchInstallStatus();
        }, 3000);
      } else {
        console.error("Installation failed:", error);
      }
    };

    const unsubscribe = onInstallComplete(handleInstallComplete);
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-secondary">
      <TitleBar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {isChecking ? (
            <CheckingInstallationPage />
        ) : (
            <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/error/microsoft-store" element={<IncompatibleSpotifyPage />} />
                <Route path="/error/old-install" element={<OldInstallFoundPage fetchInstall={fetchInstallStatus} />} />
                <Route path="/install" element={<InstallWizardPage installStatus={installStatus} onInstallComplete={() => {}} />} />
                
                <Route element={<Layout />}>
                    <Route path="/dashboard" element={<DashboardPage installStatus={installStatus} />} />
                    <Route path="/marketplace/addons" element={<MarketplaceAddonsPage />} />
                    <Route path="/marketplace/themes" element={<MarketplaceThemesPage />} />
                    <Route path="/marketplace/apps" element={<MarketplaceAppsPage />} />
                    <Route path="/submit" element={<SubmitAddonPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        )}
      </div>
    </div>
  );
}
