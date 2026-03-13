import OldInstallFound from "../components/OldInstallFound";

export default function OldInstallFoundPage({ fetchInstall }: { fetchInstall: () => Promise<void> }) {
  return <OldInstallFound fetchInstall={fetchInstall} />;
}
