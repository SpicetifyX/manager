import { useEffect, useState } from "react";
import { FaChevronLeft, FaSave, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import * as backend from "../../wailsjs/go/app/App";
import { useSpicetify } from "../context/SpicetifyContext";
import OklchPicker from "./OklchPicker";

export default function EditingTheme({
  editingTheme,
  setEditingTheme,
}: {
  editingTheme: string | null;
  setEditingTheme: (val: string | null) => void;
}) {
  const { refreshThemes } = useSpicetify();
  const [presets, setPresets] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [currentColor, setCurrentColor] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    if (editingTheme) {
      fetchPresets();
      // Make window bigger for editing
      backend.SetWindowMaxSize(1400, 900);
      backend.SetWindowMinSize(1100, 750);
      backend.SetWindowSize(1280, 800);
    }
    return () => {
      // Revert to original size
      backend.SetWindowMaxSize(950, 640);
      backend.SetWindowMinSize(950, 640);
      backend.SetWindowSize(950, 640);
    };
  }, [editingTheme]);

  useEffect(() => {
    if (editingTheme && selectedPreset && selectedKey && currentColor) {
      const cleanColor = currentColor.startsWith("#") ? currentColor.slice(1) : currentColor;
      backend.BroadcastColorUpdate(editingTheme, selectedPreset, selectedKey, cleanColor);
    }
  }, [currentColor, selectedKey, selectedPreset]);

  const fetchPresets = async () => {
    setLoading(true);
    try {
      const data = await backend.GetThemePresets(editingTheme!);
      setPresets(data || {});
      
      // Select first preset and key by default if available
      const presetNames = Object.keys(data || {});
      if (presetNames.length > 0) {
        const firstPreset = presetNames[0];
        setSelectedPreset(firstPreset);
        const keys = Object.keys(data[firstPreset] || {});
        if (keys.length > 0) {
          const firstKey = keys[0];
          setSelectedKey(firstKey);
          setCurrentColor(formatColor(data[firstPreset][firstKey]));
        }
      }
    } catch (err) {
      console.error("Failed to fetch presets:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatColor = (val: string) => {
    val = val.trim();
    if (!val.startsWith("#")) {
      return `#${val}`;
    }
    return val;
  };

  const handleKeyClick = (preset: string, key: string, value: string) => {
    setSelectedPreset(preset);
    setSelectedKey(key);
    setCurrentColor(formatColor(value));
    setSaveStatus(null);
  };

  const handleSave = async () => {
    if (!editingTheme || !selectedPreset || !selectedKey) return;
    
    setSaving(true);
    setSaveStatus(null);
    try {
      // Spicetify expects hex without #
      const cleanColor = currentColor.startsWith("#") ? currentColor.slice(1) : currentColor;
      const success = await backend.UpdateThemePreset(editingTheme, selectedPreset, selectedKey, cleanColor);
      if (success) {
        setSaveStatus("success");
        // Update local state
        setPresets(prev => ({
          ...prev,
          [selectedPreset]: {
            ...prev[selectedPreset],
            [selectedKey]: cleanColor
          }
        }));
        // Refresh global themes list to update color schemes
        await refreshThemes(false);
      } else {
        setSaveStatus("error");
      }
    } catch (err) {
      console.error("Failed to save preset:", err);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex w-full flex-shrink-0 flex-col border-b border-[#2a2a2a] bg-main select-none">
        <div className="flex h-12 items-center justify-between pl-1 pr-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditingTheme(null)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#a0a0a0] transition-colors hover:bg-[#2a2a2a] hover:text-white"
              title="Back"
            >
              <FaChevronLeft />
            </button>
            <span className="text-gray-300 font-medium truncate">Editing Theme: {editingTheme}</span>
          </div>
          {selectedKey && (
             <div className="flex items-center gap-4">
                {saveStatus === "success" && (
                    <div className="flex items-center gap-1.5 text-green-400">
                        <FaCheckCircle className="text-xs" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Saved</span>
                    </div>
                )}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded bg-brand px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-brand-hover active:bg-brand-active disabled:opacity-50"
                >
                    {saving ? "Saving..." : "Save Changes"}
                </button>
             </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden bg-darker">
        {loading ? (
          <div className="flex flex-1 items-center justify-center text-[#a0a0a0]">
            <div className="animate-pulse">Loading presets...</div>
          </div>
        ) : (
          <>
            {/* Sidebar with presets and keys */}
            <div className="w-1/4 border-r border-[#2a2a2a] overflow-hidden bg-main/50 flex flex-col">
              <div className="p-4 border-b border-[#2a2a2a]">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#a0a0a0] mb-2 block">Theme Preset</label>
                <select
                  value={selectedPreset || ""}
                  onChange={(e) => {
                    const newPreset = e.target.value;
                    setSelectedPreset(newPreset);
                    const keys = Object.keys(presets[newPreset] || {});
                    if (keys.length > 0) {
                      const firstKey = keys[0];
                      setSelectedKey(firstKey);
                      setCurrentColor(formatColor(presets[newPreset][firstKey]));
                    }
                  }}
                  className="w-full bg-tertiary text-white border border-[#2a2a2a] rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#d63c6a]"
                >
                  {Object.keys(presets).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {selectedPreset && presets[selectedPreset] ? (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#a0a0a0] mb-2 block">Color Keys</label>
                    {Object.entries(presets[selectedPreset]).map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => handleKeyClick(selectedPreset, key, value)}
                        className={`flex w-full items-center justify-between rounded px-3 py-2 text-sm transition-all ${
                          selectedKey === key
                            ? "bg-brand text-white"
                            : "text-[#a0a0a0] hover:bg-tertiary hover:text-white"
                        }`}
                      >
                        <span className="truncate mr-2 font-medium">{key}</span>
                        <div 
                          className="h-3.5 w-3.5 rounded-sm border border-white/10 flex-shrink-0" 
                          style={{ backgroundColor: formatColor(value) }}
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-[#a0a0a0] text-sm italic p-2">No presets found</div>
                )}
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {selectedKey ? (
                <div className="mx-auto max-w-4xl">
                   <div className="mb-4 flex items-end justify-between border-b border-[#2a2a2a] pb-2">
                      <div>
                        <h2 className="text-xl font-bold text-white leading-tight">{selectedKey}</h2>
                        <p className="text-xs text-[#a0a0a0]">Preset: <span className="text-[#d63c6a] font-mono">{selectedPreset}</span></p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-text-input-label">Current Hex</span>
                        <span className="font-mono text-lg text-white">{currentColor.toUpperCase()}</span>
                      </div>
                   </div>

                   <OklchPicker hex={currentColor} onChange={setCurrentColor} />
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-[#555]mer">
                  <div className="mb-4 rounded-full border border-[#2a2a2a] bg-main p-6">
                    <FaSave className="text-4xl opacity-10" />
                  </div>
                  <p className="text-base font-medium">Select a color key from the sidebar to begin editing</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
