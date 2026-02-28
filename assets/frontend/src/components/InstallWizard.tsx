import { useRef, useEffect, useState } from "react";
import { FaCheckCircle, FaSpinner, FaDownload, FaPuzzlePiece, FaPalette } from "react-icons/fa";
import TerminalOutput, { TerminalOutputRef } from "./TerminalOutput";
import { InstallStep, StepStatus } from "../App";
import { onCommandOutput } from "../utils/bridge";
import preinstall from "../../../preinstall.json";

export default function InstallWizard({
  isInstalling,
  updateStepStatus,
  steps,
}: {
  steps: InstallStep[];
  installStatus: { spotify_installed: boolean; spicetify_installed: boolean };
  updateStepStatus: (stepId: string, status: StepStatus) => void;
  isInstalling: boolean;
}) {
  const terminalRef = useRef<TerminalOutputRef>(null);
  const [installStats, setInstallStats] = useState({
    extensions: 0,
    themes: 0,
    version: "",
  });

  const allComplete = steps.every((step) => step.status === "complete");
  const hasStartedInstall = useRef(false);

  useEffect(() => {
    if (isInstalling && !hasStartedInstall.current) {
      hasStartedInstall.current = true;
    }
  }, [isInstalling]);

  useEffect(() => {
    const listener = (_event: any, data: string) => {
      terminalRef.current?.write(data);

      const text = data.toLowerCase();

      if (text.includes("appl") || text.includes("patch") || text.includes("overwriting")) {
        updateStepStatus("apply", "active");
      } else if (text.includes("applied successfully") || text.includes("restart spotify")) {
        updateStepStatus("apply", "complete");
      }

      const versionMatch = data.match(/v?(\d+\.\d+\.\d+)/);
      if (versionMatch) {
        setInstallStats((prev) => ({ ...prev, version: versionMatch[1] }));
      }

      const extMatch = data.match(/(\d+)\s+extension/);
      if (extMatch)
        setInstallStats((prev) => ({
          ...prev,
          extensions: parseInt(extMatch[1]),
        }));

      const themeMatch = data.match(/(\d+)\s+theme/);
      if (themeMatch)
        setInstallStats((prev) => ({
          ...prev,
          themes: parseInt(themeMatch[1]),
        }));
    };

    const unsubscribe = onCommandOutput(listener);

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="flex h-full w-full flex-1 flex-col overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden p-5">
        {isInstalling ? (
          <div className="flex h-full flex-col gap-3">
            <div className="flex items-center justify-between rounded-lg border border-[#2a2a2a] bg-[#121418] p-3.5">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${allComplete ? "bg-[#2a2a2a]" : "bg-[#d63c6a]"}`}>
                  {allComplete ? <FaCheckCircle className="h-5 w-5 text-white" /> : <FaSpinner className="h-5 w-5 animate-spin text-white" />}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{allComplete ? "Installation Complete" : "Installing Spicetify"}</h3>
                  <p className="text-xs text-[#a0a0a0]">{allComplete ? "Restart Spotify to see changes" : "Customizing your Spotify client"}</p>
                </div>
              </div>
              <div className="flex gap-4">
                {installStats.version && (
                  <div className="text-right">
                    <p className="text-xs text-[#a0a0a0]">Version</p>
                    <p className="text-sm font-semibold text-white">{installStats.version}</p>
                  </div>
                )}
                {installStats.extensions > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-[#a0a0a0]">Extensions</p>
                    <p className="text-sm font-semibold text-[#d63c6a]">{installStats.extensions}</p>
                  </div>
                )}
                {installStats.themes > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-[#a0a0a0]">Themes</p>
                    <p className="text-sm font-semibold text-[#d63c6a]">{installStats.themes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-1 gap-3 overflow-hidden pb-5">
              <div className="flex w-48 shrink-0 flex-col gap-2">
                {steps.map((step) => {
                  const Icon = step.icon;
                  const isComplete = step.status === "complete";
                  const isActive = step.status === "active";

                  return (
                    <div
                      key={step.id}
                      className={`flex items-start gap-3 rounded-lg border p-3 transition-all ${isActive
                        ? "border-[#d63c6a] bg-[#d63c6a]/10"
                        : isComplete
                          ? "border-[#2a2a2a] bg-[#121418]"
                          : "border-[#2a2a2a] bg-[#121418]/50 opacity-60"
                        }`}
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all ${isActive ? "bg-[#d63c6a] shadow-lg shadow-[#d63c6a]/50" : isComplete ? "bg-[#2a2a2a]" : "bg-[#1a1a1a]"
                          }`}
                      >
                        {isComplete ? (
                          <FaCheckCircle className="h-4 w-4 text-white" />
                        ) : isActive ? (
                          <Icon className="h-4 w-4 animate-pulse text-white" />
                        ) : (
                          <Icon className="h-4 w-4 text-[#666]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className={`text-sm font-semibold ${isActive || isComplete ? "text-white" : "text-[#666]"}`}>{step.title}</h4>
                        <p className={`text-xs ${isActive ? "text-[#a0a0a0]" : "text-[#666]"}`}>{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#0c0e11]">
                <div className="flex items-center justify-between border-b border-[#2a2a2a] px-3 py-2">
                  <span className="text-xs font-medium text-white">Installation Log</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-[#d63c6a]"></div>
                    <span className="text-xs text-[#a0a0a0]">Live</span>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden p-3 font-mono text-xs">
                  <TerminalOutput ref={terminalRef} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <div className="mb-6 rounded-lg border border-[#d63c6a]/20 bg-[#d63c6a]/5 p-4 text-sm text-[#a0a0a0]">
              <p className="leading-relaxed">
                SpicetifyX will manage Spicetify installations internally, so an existing Spicetify installation isn't required.
                After clicking <span className="font-semibold text-white">Install</span>, the following extensions and themes will be automatically installed:
              </p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              <div className="flex flex-col gap-2">
                {preinstall.themes.map((theme) => (
                  <div key={theme.name} className="flex items-center gap-3 rounded-lg border border-[#2a2a2a] bg-[#121418] p-3 transition-colors hover:bg-[#1e2228]">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#1e2228]">
                      <FaPalette className="h-5 w-5 text-[#d63c6a]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-bold text-white">{theme.name}</h3>
                        <span className="rounded bg-[#d63c6a]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#d63c6a]">Theme</span>
                      </div>
                      <p className="truncate text-xs text-[#a0a0a0]">
                        {theme.authors[0]?.description || "Default theme for SpicetifyX."}
                      </p>
                    </div>
                  </div>
                ))}

                {preinstall.extensions.map((ext) => (
                  <div key={ext.name} className="flex items-center gap-3 rounded-lg border border-[#2a2a2a] bg-[#121418] p-3 transition-colors hover:bg-[#1e2228]">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#1e2228]">
                      <FaPuzzlePiece className="h-5 w-5 text-[#d63c6a]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-bold text-white">{ext.name}</h3>
                        <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-500">Extension</span>
                      </div>
                      <p className="truncate text-xs text-[#a0a0a0]">
                        {ext.raw_meta_content?.description || "Enhances your Spotify experience."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
