import { FaAppStore, FaCog, FaHome, FaPalette, FaPuzzlePiece } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex w-16 flex-col items-center bg-[#121418] p-4">
      <Link
        className={`flex items-center justify-center rounded-full px-3 py-3 ${location.pathname === "/" ? "bg-[#d63c6a] text-white" : "text-[#a0a0a0] hover:bg-[#2a2e34]"}`}
        to={"/"}
      >
        <FaHome size={20} />
      </Link>
      <Link
        className={`mt-2 flex items-center justify-center rounded-full px-3 py-3 ${location.pathname === "/extensions" || location.pathname === "/extensions/marketplace" ? "bg-[#d63c6a] text-white" : "text-[#a0a0a0] hover:bg-[#2a2e34]"}`}
        to={"/extensions"}
      >
        <FaPuzzlePiece size={20} />
      </Link>
      <Link
        className={`mt-2 flex items-center justify-center rounded-full px-3 py-3 ${location.pathname === "/themes" || location.pathname === "/themes/marketplace" ? "bg-[#d63c6a] text-white" : "text-[#a0a0a0] hover:bg-[#2a2a2a]"}`}
        to={"/themes"}
      >
        <FaPalette size={20} />
      </Link>
      <Link
        className={`mt-2 flex items-center justify-center rounded-full px-3 py-3 ${location.pathname === "/apps" || location.pathname === "/apps/marketplace" ? "bg-[#d63c6a] text-white" : "text-[#a0a0a0] hover:bg-[#2a2a2a]"}`}
        to={"/apps"}
      >
        <FaAppStore size={20} />
      </Link>
      <div className="mt-auto">
        <Link
          className={`flex items-center justify-center rounded-full px-3 py-3 ${location.pathname === "/settings" ? "bg-[#d63c6a] text-white" : "text-[#a0a0a0] hover:bg-[#2a2a2a]"}`}
          to={"/settings"}
        >
          <FaCog size={20} />
        </Link>
      </div>
    </div>
  );
}
