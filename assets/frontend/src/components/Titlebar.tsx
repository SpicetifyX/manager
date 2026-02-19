import { FaMinus, FaTimes } from "react-icons/fa";
import { WindowMinimize, WindowClose } from "../../wailsjs/go/app/App";

export default function Titlebar() {
  const handleMinimize = async () => {
    await WindowMinimize();
  };

  const handleClose = async () => {
    await WindowClose();
  };

  return (
    <div
      className="flex h-10 w-full flex-shrink-0 items-center justify-between border-b border-[#2a2a2a] bg-[#121418] px-4 select-none"
      style={{ "--wails-draggable": "drag" } as React.CSSProperties}
    >
      <div className="text-xs font-semibold text-white">SpicetifyX Manager</div>
      <div className="flex items-center gap-2" style={{ "--wails-draggable": "no-drag" } as React.CSSProperties}>
        <button
          onClick={handleMinimize}
          className="flex h-8 w-8 items-center justify-center rounded text-[#a0a0a0] transition-colors hover:bg-[#2a2a2a] hover:text-white"
          title="Minimize"
        >
          <FaMinus size={12} />
        </button>
        <button
          onClick={handleClose}
          className="flex h-8 w-8 items-center justify-center rounded text-[#a0a0a0] transition-colors hover:bg-[#d63c6a] hover:text-white"
          title="Close"
        >
          <FaTimes size={14} />
        </button>
      </div>
    </div>
  );
}
