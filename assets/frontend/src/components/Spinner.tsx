export default function Spinner({ className }: { className?: string }) {
  return (
    <div className={`relative ${className || "h-5 w-5"}`}>
      <div className="absolute inset-0 rounded-full border-4 border-[#d63c6a]/20"></div>
      <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#d63c6a] border-r-[#d63c6a]"></div>
    </div>
  );
}
