export default function Header({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="w-full shrink-0 border-b border-[#2a2a2a] bg-[#121418] px-6 py-4">
      <h1 className="text-lg font-bold text-white">{title}</h1>
      <p className="text-xs text-[#a0a0a0]">{description}</p>
    </div>
  );
}
