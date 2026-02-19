// import { useEffect, useState } from "react";
// import InstallWizard from "./components/InstallWizard";
// import OldInstallFound from "./components/OldInstallFound";
// import CheckingInstallation from "./components/CheckingInstallation";
// import Header from "./components/Header";
// import Footer from "./components/Footer";
// import TitleBar from "./components/Titlebar";
// import { FaDownload, FaHome, FaPuzzlePiece, FaPalette, FaAppStore, FaCog, FaRocket } from "react-icons/fa";
// import Dashboard from "./components/Dashboard";
// import MarketplaceThemes from "./components/MarketplaceThemes";
// import MarketplaceApps from "./components/MarketplaceApps";
// import Settings from "./components/Settings";
// import { FaShield } from "react-icons/fa6";
// import MarketplaceAddons from "./components/MarketplaceAddons";

// export type StepStatus = "pending" | "active" | "complete" | "error";

// export interface InstallStep {
//   id: string;
//   title: string;
//   description: string;
//   icon: React.ComponentType<{ className?: string }>;
//   status: StepStatus;
//   details?: string;
// }

// export default function App() {
//   const [installing, setInstalling] = useState(false);
//   const [installCompleted, setInstallCompleted] = useState(false);
//   const [activeTab, setActiveTab] = useState("dashboard");
//   const [steps, setSteps] = useState<InstallStep[]>([
//     {
//       id: "install",
//       title: "Install",
//       description: "Download & extract",
//       icon: FaDownload,
//       status: "pending",
//     },
//     {
//       id: "setup",
//       title: "Setup",
//       description: "Configure files",
//       icon: FaCog,
//       status: "pending",
//     },
//     {
//       id: "backup",
//       title: "Backup",
//       description: "Protect files",
//       icon: FaShield,
//       status: "pending",
//     },
//     {
//       id: "apply",
//       title: "Apply",
//       description: "Patch client",
//       icon: FaRocket,
//       status: "pending",
//     },
//   ]);

//   useEffect(() => {
//     const rpcDetails: Record<string, string> = {
//       dashboard: "Viewing Dashboard",
//       addons: "Browsing Extensions",
//       themes: "Browsing Themes",
//       snippets: "Browsing Snippets",
//       apps: "Browsing Apps",
//       settings: "Changing Settings",
//     };
//     window.electron.setRpcActivity(rpcDetails[activeTab] || "Customizing Spotify");
//   }, [activeTab]);

//   function updateStepStatus(stepId: string, status: StepStatus) {
//     setSteps((prev) => {
//       const updated = [...prev];
//       const currentIndex = updated.findIndex((s) => s.id === stepId);

//       if (status === "active") {
//         if (currentIndex > 0 && updated[currentIndex - 1].status === "active") {
//           updated[currentIndex - 1].status = "complete";
//         }
//         for (let i = 0; i < currentIndex - 1; i++) {
//           if (updated[i].status === "pending") {
//             updated[i].status = "complete";
//           }
//         }
//       }

//       if (status === "complete") {
//         for (let i = 0; i < currentIndex; i++) {
//           if (updated[i].status === "pending" || updated[i].status === "active") {
//             updated[i].status = "complete";
//           }
//         }
//       }

//       updated[currentIndex].status = status;
//       return updated;
//     });
//   }

//   async function installSpicetify() {
//     setInstalling(true);

//     updateStepStatus("install", "active");
//     await window.electron.installSpicetifyBinary();
//     updateStepStatus("install", "complete");

//     updateStepStatus("setup", "active");
//     await window.electron.setupSpicetifyAssets();
//     updateStepStatus("setup", "complete");

//     updateStepStatus("backup", "active");
//     await window.electron.startInstall();
//     updateStepStatus("backup", "complete");
//   }

//   async function fetchInstallStatus() {
//     setIsChecking(true);
//     try {
//       const status = await window.electron.checkInstallation();
//       setInstallStatus(status);
//     } catch (error) {
//       console.error("Failed to check installation status:", error);
//     } finally {
//       setIsChecking(false);
//     }
//   }

//   useEffect(() => {
//     fetchInstallStatus();

//     const handleInstallComplete = (_event: any, { success, error }: { success: boolean; error?: string }) => {
//       if (success) {
//         setTimeout(() => {
//           setInstallCompleted(true);
//           setTimeout(() => {
//             setInstalling(false);
//             fetchInstallStatus();
//           }, 3000);
//         }, 500);
//       } else {
//         setInstalling(false);
//         console.error("Installation failed:", error);
//         alert(`Installation failed: ${error}`);
//       }
//     };

//     const unsubscribe = window.electron.onInstallComplete(handleInstallComplete);

//     return () => {

//       unsubscribe();
//     };
//   }, []);

//   return (
//         </div >
//   );
// }
