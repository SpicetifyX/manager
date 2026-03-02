import { FaTrashAlt, FaExclamationTriangle } from "react-icons/fa";

interface ConfirmDeleteModalProps {
  show: boolean;
  itemName: string;
  itemType: "extension" | "theme" | "app" | "snippet";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDeleteModal({ show, itemName, itemType, onConfirm, onCancel }: ConfirmDeleteModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative flex w-full max-w-sm flex-col items-center overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#121418] p-8 shadow-2xl text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20">
          <FaExclamationTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="mb-3 text-lg font-bold text-white">Delete {itemType.charAt(0).toUpperCase() + itemType.slice(1)}?</h2>
        <div className="mb-5 w-full rounded-lg bg-[#1e2228] p-4 text-left">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#a0a0a0]">Item to remove</p>
          <div className="flex items-center gap-2 text-sm text-white">
            <FaTrashAlt className="h-3 w-3 flex-shrink-0 text-red-400" />
            <span className="font-medium truncate">{itemName}</span>
          </div>
          <p className="mt-3 text-xs text-[#a0a0a0] leading-relaxed">
            {itemType === "theme"
              ? "The theme files will be permanently removed and Spotify will revert to the default theme if this one is active."
              : itemType === "app"
                ? "The custom app will be permanently removed from Spicetify."
                : "The extension file will be permanently removed from Spicetify."}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2">
          <button
            onClick={onConfirm}
            className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            Confirm Delete
          </button>
          <button
            onClick={onCancel}
            className="w-full rounded-lg bg-transparent px-4 py-2 text-sm font-semibold text-[#a0a0a0] transition-colors hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
