import MarketplaceThemes from "../components/MarketplaceThemes";
import { useOutletContext } from "react-router-dom";

export default function MarketplaceThemesPage() {
  const { setThemesDirty, resetKey, snapshotKey } = useOutletContext<any>();
  return <MarketplaceThemes onDirtyChange={setThemesDirty} resetKey={resetKey} snapshotKey={snapshotKey} />;
}
