import { useEffect, useState } from "react";
import InstallWizard from "./components/InstallWizard";
import OldInstallFound from "./components/OldInstallFound";
import CheckingInstallation from "./components/CheckingInstallation";
import Header from "./components/Header";
import Footer from "./components/Footer";
import TitleBar from "./components/TitleBar";
import { FaDownload, FaHome, FaPuzzlePiece, FaPalette, FaAppStore, FaCog, FaRocket } from "react-icons/fa";
import Dashboard from "./components/Dashboard";
import MarketplaceThemes from "./components/MarketplaceThemes";
import MarketplaceApps from "./components/MarketplaceApps";
import Settings from "./components/Settings";
import { FaShield } from "react-icons/fa6";
import MarketplaceAddons from "./components/MarketplaceAddons";
import PendingChangesBar from "./components/PendingChangesBar";

export type StepStatus = "pending" | "active" | "complete" | "error";

export interface InstallStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: StepStatus;
  details?: string;
}

export default function App() {
  const [isChecking, setIsChecking] = useState(true);
  const [installStatus, setInstallStatus] = useState<null | {
    spotify_installed: boolean;
    spicetify_installed: boolean;
    already_patched: boolean;
  }>(null);
  const [installing, setInstalling] = useState(false);
  const [installCompleted, setInstallCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const markDirty = () => setHasPendingChanges(true);
  const [steps, setSteps] = useState<InstallStep[]>([
    {
      id: "install",
      title: "Install",
      description: "Download & extract",
      icon: FaDownload,
      status: "pending",
    },
    {
      id: "setup",
      title: "Setup",
      description: "Configure files",
      icon: FaCog,
      status: "pending",
    },
    {
      id: "backup",
      title: "Backup",
      description: "Protect files",
      icon: FaShield,
      status: "pending",
    },
    {
      id: "apply",
      title: "Apply",
      description: "Patch client",
      icon: FaRocket,
      status: "pending",
    },
  ]);

  useEffect(() => {
    const rpcDetails: Record<string, string> = {
      dashboard: "Viewing Dashboard",
      addons: "Browsing Extensions",
      themes: "Browsing Themes",
      snippets: "Browsing Snippets",
      apps: "Browsing Apps",
      settings: "Changing Settings",
    };
    window.electron.setRpcActivity(rpcDetails[activeTab] || "Customizing Spotify");
  }, [activeTab]);

  function updateStepStatus(stepId: string, status: StepStatus) {
    setSteps((prev) => {
      const updated = [...prev];
      const currentIndex = updated.findIndex((s) => s.id === stepId);

      if (status === "active") {
        if (currentIndex > 0 && updated[currentIndex - 1].status === "active") {
          updated[currentIndex - 1].status = "complete";
        }
        for (let i = 0; i < currentIndex - 1; i++) {
          if (updated[i].status === "pending") {
            updated[i].status = "complete";
          }
        }
      }

      if (status === "complete") {
        for (let i = 0; i < currentIndex; i++) {
          if (updated[i].status === "pending" || updated[i].status === "active") {
            updated[i].status = "complete";
          }
        }
      }

      updated[currentIndex].status = status;
      return updated;
    });
  }

  async function installSpicetify() {
    setInstalling(true);

    updateStepStatus("install", "active");
    await window.electron.installSpicetifyBinary();
    updateStepStatus("install", "complete");

    updateStepStatus("setup", "active");
    await window.electron.setupSpicetifyAssets();
    updateStepStatus("setup", "complete");

    updateStepStatus("backup", "active");
    await window.electron.startInstall();
    updateStepStatus("backup", "complete");
  }

  async function fetchInstallStatus() {
    setIsChecking(true);
    try {
      const status = await window.electron.checkInstallation();
      setInstallStatus(status);
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
          setInstallCompleted(true);
          setTimeout(() => {
            setInstalling(false);
            fetchInstallStatus();
          }, 3000);
        }, 500);
      } else {
        setInstalling(false);
        console.error("Installation failed:", error);
        alert(`Installation failed: ${error}`);
      }
    };

    const unsubscribe = window.electron.onInstallComplete(handleInstallComplete);

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#171b20]">
      <TitleBar />
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        {isChecking ? (
          <>
            <Header title="Spicetify Installer" description="Checking Existing Spicetify & Spotify Installations" />
            <CheckingInstallation />
            <Footer hidden />
          </>
        ) : installStatus && installStatus.spicetify_installed && !installStatus.already_patched ? (
          <OldInstallFound fetchInstall={fetchInstallStatus} />
        ) : installStatus && !installStatus.already_patched ? (
          <>
            <Header title="Spicetify Installer" description="Select Install to Continue" />
            <InstallWizard installStatus={installStatus} isInstalling={installing} updateStepStatus={updateStepStatus} steps={steps} />
            <Footer>
              <button
                onClick={installSpicetify}
                disabled={installing || installCompleted}
                className={`flex items-center gap-2 rounded px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                  installing
                    ? "cursor-not-allowed bg-[#a02950] text-white"
                    : installCompleted
                      ? "cursor-not-allowed bg-[#2a2a2a] text-white"
                      : "bg-[#d63c6a] text-white hover:bg-[#c52c5a] active:bg-[#b51c4a]"
                }`}
              >
                <FaDownload />
                {installing ? "Installing..." : installCompleted ? "Complete!" : "Install Spicetify"}
              </button>
            </Footer>
          </>
        ) : (
          <div className="flex h-full w-full flex-1">
            <div className="flex w-16 flex-col items-center bg-[#121418] p-4">
              <button
                className={`flex items-center justify-center rounded-full px-3 py-3 ${activeTab === "dashboard" ? "bg-[#d63c6a] text-white" : "text-[#a0a0a0] hover:bg-[#2a2e34]"}`}
                onClick={() => setActiveTab("dashboard")}
              >
                <FaHome size={20} />
              </button>
              <button
                className={`mt-2 flex items-center justify-center rounded-full px-3 py-3 ${activeTab === "addons" ? "bg-[#d63c6a] text-white" : "text-[#a0a0a0] hover:bg-[#2a2e34]"}`}
                onClick={() => setActiveTab("addons")}
              >
                <FaPuzzlePiece size={20} />
              </button>
              <button
                className={`mt-2 flex items-center justify-center rounded-full px-3 py-3 ${activeTab === "themes" ? "bg-[#d63c6a] text-white" : "text-[#a0a0a0] hover:bg-[#2a2a2a]"}`}
                onClick={() => setActiveTab("themes")}
              >
                <FaPalette size={20} />
              </button>
              <button
                className={`mt-2 flex items-center justify-center rounded-full px-3 py-3 ${activeTab === "apps" ? "bg-[#d63c6a] text-white" : "text-[#a0a0a0] hover:bg-[#2a2a2a]"}`}
                onClick={() => setActiveTab("apps")}
              >
                <FaAppStore size={20} />
              </button>
              <div className="mt-auto">
                <button
                  className={`flex items-center justify-center rounded-full px-3 py-3 ${activeTab === "settings" ? "bg-[#d63c6a] text-white" : "text-[#a0a0a0] hover:bg-[#2a2a2a]"}`}
                  onClick={() => setActiveTab("settings")}
                >
                  <FaCog size={20} />
                </button>
              </div>
            </div>
            <div className="relative flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                {installStatus && activeTab === "dashboard" && <Dashboard installStatus={installStatus} onNavigate={setActiveTab} />}
                {activeTab === "addons" && <MarketplaceAddons markDirty={markDirty} />}
                {activeTab === "themes" && <MarketplaceThemes markDirty={markDirty} />}
                {activeTab === "apps" && <MarketplaceApps markDirty={markDirty} />}
                {activeTab === "settings" && <Settings />}
              </div>
              {hasPendingChanges && <PendingChangesBar onApplied={() => setHasPendingChanges(false)} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
