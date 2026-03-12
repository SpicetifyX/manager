interface Props {
  error: string;
  onRetry?: () => void;
}

export default function ErrorState({ error, onRetry }: Props) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <span className="text-lg text-red-400">{error}</span>
        {onRetry && (
          <button onClick={onRetry} className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover">
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
