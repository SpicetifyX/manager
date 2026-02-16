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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="flex w-full max-w-md flex-col rounded-lg border border-[#2a2a2a] bg-[#121418] p-6 shadow-lg">
        <div className="flex-1">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3c1212]">
              <FaTrashAlt className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Delete {itemType.charAt(0).toUpperCase() + itemType.slice(1)}</h2>
              <p className="text-sm text-[#a0a0a0]">This action cannot be undone</p>
            </div>
          </div>
          <p className="mb-2 text-[#a0a0a0]">
            Are you sure you want to delete <span className="font-semibold text-white">"{itemName}"</span>?
          </p>
          <p className="text-sm text-[#666]">
            {itemType === "theme"
              ? "The theme files will be permanently removed and Spotify will revert to the default theme if this one is active."
              : itemType === "app"
                ? "The custom app will be permanently removed from Spicetify."
                : "The extension file will be permanently removed from Spicetify."}
          </p>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onCancel} className="rounded-md bg-gray-600 px-4 py-2 text-white duration-150 hover:bg-gray-700">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-white duration-150 hover:bg-red-700"
          >
            <FaTrashAlt className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
