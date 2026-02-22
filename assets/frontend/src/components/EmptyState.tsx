interface Props {
  label: string;
}

export default function EmptyState({ label }: Props) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <span className="text-lg text-[#a0a0a0]">{label}</span>
    </div>
  );
}
