"use client";

interface TxProgressProps {
  title: string;
  progress: number | null;
  status: "generating" | "submitting" | "success" | "error";
  error?: string | null;
  txHash?: string | null;
  onDone: () => void;
  onRetry?: () => void;
}

export function TxProgress({
  title,
  progress,
  status,
  error,
  txHash,
  onDone,
  onRetry,
}: TxProgressProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      {status === "generating" && (
        <>
          <div className="w-14 h-14 rounded-full border-2 border-neutral-800 border-t-indigo-500 animate-spin mb-6" />
          <p className="text-sm font-medium text-neutral-200 mb-2">{title}</p>
          <p className="text-xs text-neutral-500 mb-4">Generating ZK proof...</p>
          {progress !== null && (
            <div className="w-48 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          )}
          <p className="text-xs text-neutral-500 mt-2 tabular-nums">
            {progress !== null ? `${Math.round(progress)}%` : "Starting..."}
          </p>
        </>
      )}

      {status === "submitting" && (
        <>
          <div className="w-14 h-14 rounded-full border-2 border-neutral-800 border-t-indigo-500 animate-spin mb-6" />
          <p className="text-sm font-medium text-neutral-200 mb-2">{title}</p>
          <p className="text-xs text-neutral-500">Submitting transaction...</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mb-6 scale-in">
            <span className="text-green-400 text-2xl">✓</span>
          </div>
          <p className="text-sm font-medium text-neutral-200 mb-2">
            Transaction Sent
          </p>
          {txHash && (
            <p className="text-xs text-neutral-500 font-mono mb-4">
              {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </p>
          )}
          <button
            onClick={onDone}
            className="px-8 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white text-sm font-medium transition-colors"
          >
            Done
          </button>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mb-6 scale-in">
            <span className="text-red-400 text-2xl">!</span>
          </div>
          <p className="text-sm font-medium text-neutral-200 mb-2">
            Transaction Failed
          </p>
          <p className="text-xs text-red-400 text-center mb-6 max-w-xs">
            {error || "Unknown error"}
          </p>
          <div className="flex gap-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-6 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm transition-colors"
              >
                Retry
              </button>
            )}
            <button
              onClick={onDone}
              className="px-6 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm transition-colors"
            >
              Back
            </button>
          </div>
        </>
      )}
    </div>
  );
}
