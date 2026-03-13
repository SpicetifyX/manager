import React, { useState } from "react";
import InstallWizard from "../components/InstallWizard";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaDownload, FaCog, FaRocket } from "react-icons/fa";
import { FaShield } from "react-icons/fa6";
import * as backend from "../../wailsjs/go/app/App";
import { InstallStep, StepStatus } from "../types/install";

export default function InstallWizardPage({ installStatus, onInstallComplete }: { installStatus: any; onInstallComplete: () => void }) {
  const [installing, setInstalling] = useState(false);
  const [installCompleted, setInstallCompleted] = useState(false);
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
    await backend.InstallSpicetifyBinary();
    updateStepStatus("install", "complete");

    updateStepStatus("setup", "active");
    await backend.SetupSpicetifyAssets();
    updateStepStatus("setup", "complete");

    updateStepStatus("backup", "active");
    await backend.StartInstall();
    updateStepStatus("backup", "complete");
    
    // We expect onInstallComplete to be called from the parent (App) when it receives the event from backend.
  }

  return (
    <>
      <Header title="Spicetify Installer" description="Select Install to Continue" />
      <InstallWizard installStatus={installStatus} isInstalling={installing} updateStepStatus={updateStepStatus} steps={steps} />
      <Footer>
        <div className="flex w-full justify-end">
          <button
            onClick={installSpicetify}
            disabled={installing || installCompleted}
            className={`flex items-center gap-2 rounded px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${installing
                ? "cursor-not-allowed bg-brand-disabled text-white"
                : installCompleted
                  ? "cursor-not-allowed bg-[#2a2a2a] text-white"
                  : "bg-brand text-white hover:bg-brand-hover active:bg-brand-active"
              }`}
          >
            <FaDownload />
            {installing ? "Installing..." : installCompleted ? "Complete!" : "Install Spicetify"}
          </button>
        </div>
      </Footer>
    </>
  );
}
