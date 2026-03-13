import MarketplaceAddons from "../components/MarketplaceAddons";
import { useOutletContext } from "react-router-dom";

export default function MarketplaceAddonsPage() {
  const { setAddonsDirty, resetKey, snapshotKey } = useOutletContext<any>();
  return <MarketplaceAddons onDirtyChange={setAddonsDirty} resetKey={resetKey} snapshotKey={snapshotKey} />;
}
