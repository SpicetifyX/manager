import MarketplaceApps from "../components/MarketplaceApps";
import { useOutletContext } from "react-router-dom";

export default function MarketplaceAppsPage() {
  const { setAppsDirty, resetKey, snapshotKey } = useOutletContext<any>();
  return <MarketplaceApps onDirtyChange={setAppsDirty} resetKey={resetKey} snapshotKey={snapshotKey} />;
}
