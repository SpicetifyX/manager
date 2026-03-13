import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaExclamationTriangle, FaExternalLinkAlt } from "react-icons/fa";
import * as backend from "../../wailsjs/go/app/App";

export default function IncompatibleSpotifyPage() {
  return (
    <>
      <Header title="Spicetify Installer" description="Incompatible Spotify Installation" />
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <FaExclamationTriangle className="h-8 w-8 text-red-500" />
        </div>
        <div className="max-w-md text-center">
          <h2 className="mb-3 text-lg font-bold text-white">Microsoft Store Spotify Detected</h2>
          <p className="text-sm leading-relaxed text-[#a0a0a0]">
            SpicetifyX cannot patch the Microsoft Store version of Spotify. Please uninstall Spotify from the
            Microsoft Store and install the official version from spotify.com.
          </p>
        </div>
        <button
          onClick={() => backend.OpenExternalLink("https://www.spotify.com/download")}
          className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover active:bg-brand-active"
        >
          <FaExternalLinkAlt className="h-3.5 w-3.5" />
          Download Official Spotify
        </button>
      </div>
      <Footer hidden />
    </>
  );
}
