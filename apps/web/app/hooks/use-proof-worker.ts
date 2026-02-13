"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ProofType = "shield" | "transfer" | "unshield" | "swap";

interface UseProofWorkerReturn {
  generateProof: (type: ProofType, params: Record<string, unknown>) => void;
  progress: number | null;
  result: string | null;
  error: string | null;
  isGenerating: boolean;
  cancel: () => void;
}

export function useProofWorker(): UseProofWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const generateProof = useCallback((type: ProofType, params: Record<string, unknown>) => {
    // Terminate any existing worker
    workerRef.current?.terminate();

    setProgress(0);
    setResult(null);
    setError(null);
    setIsGenerating(true);

    const worker = new Worker(
      new URL("../workers/proof-worker.ts", import.meta.url),
    );
    workerRef.current = worker;

    worker.onmessage = (event) => {
      const data = event.data;
      switch (data.type) {
        case "progress":
          setProgress(data.progress);
          break;
        case "result":
          setResult(data.serializedTransaction);
          setProgress(100);
          setIsGenerating(false);
          worker.terminate();
          break;
        case "error":
          setError(data.message);
          setIsGenerating(false);
          worker.terminate();
          break;
      }
    };

    worker.onerror = (e) => {
      setError(e.message || "Worker error");
      setIsGenerating(false);
      worker.terminate();
    };

    worker.postMessage({ type, params });
  }, []);

  const cancel = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setIsGenerating(false);
    setProgress(null);
  }, []);

  return { generateProof, progress, result, error, isGenerating, cancel };
}
