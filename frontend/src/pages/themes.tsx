import Sidebar from "../components/Sidebar";

export default function ThemesPage() {
  return (
    <div className="flex h-full w-full flex-1">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">Themes content</div>
    </div>
  );
}
