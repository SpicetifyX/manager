import { FaTrashAlt } from "react-icons/fa";

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
      <div className="flex w-full max-w-sm flex-col rounded-lg border border-[#2a2a2a] bg-[#121418] p-6 shadow-lg">
        <div className="mb-4 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#1e2228]">
            <FaTrashAlt className="h-6 w-6 text-[#d63c6a]" />
          </div>
          <h2 className="mb-1 text-lg font-bold text-white">Delete {itemType.charAt(0).toUpperCase() + itemType.slice(1)}</h2>
          <p className="text-center text-sm text-[#a0a0a0]">
            Are you sure you want to delete <span className="font-semibold text-white">"{itemName}"</span>? This action cannot be undone.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded border border-[#2a2a2a] bg-transparent px-4 py-2.5 text-sm font-semibold text-[#a0a0a0] transition hover:bg-[#1e2228] hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded bg-[#d63c6a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c52c5a] active:bg-[#b51c4a]"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
