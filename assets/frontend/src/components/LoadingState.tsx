import Spinner from "./Spinner";

interface Props {
  label?: string;
  size?: string;
}

export default function LoadingState({ label, size = "h-16 w-16" }: Props) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center space-y-6">
        <Spinner className={size} />
        {label && <span className="text-lg text-gray-100">{label}</span>}
      </div>
    </div>
  );
}
