"use client";

import { useEffect, useRef } from "react";
import { useWalletStore } from "../store";

/**
 * Hook that initializes the Railgun engine on mount.
 * Uses refs to prevent double-init in React strict mode.
 * Reads RPC URLs from NEXT_PUBLIC_* env vars.
 */
export function useRailgunEngine() {
  const engineStatus = useWalletStore((s) => s.engineStatus);
  const setEngineStatus = useWalletStore((s) => s.setEngineStatus);
  const setEngineError = useWalletStore((s) => s.setEngineError);
  const initAttempted = useRef(false);

  useEffect(() => {
    if (initAttempted.current || engineStatus !== "idle") return;
    initAttempted.current = true;

    const polygonRpc = process.env.NEXT_PUBLIC_POLYGON_RPC_URL;
    const arbitrumRpc = process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL;

    if (!polygonRpc || !arbitrumRpc) {
      setEngineError("Missing RPC URLs. Set NEXT_PUBLIC_POLYGON_RPC_URL and NEXT_PUBLIC_ARBITRUM_RPC_URL.");
      return;
    }

    setEngineStatus("initializing");

    import("@veil/core")
      .then(({ initEngine }) =>
        initEngine({
          polygonRpcUrl: polygonRpc,
          arbitrumRpcUrl: arbitrumRpc,
          ethereumRpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL,
          shouldDebug: process.env.NODE_ENV === "development",
        }),
      )
      .then(() => setEngineStatus("ready"))
      .catch((err) => {
        console.error("Railgun engine init failed:", err);
        setEngineError(err instanceof Error ? err.message : String(err));
      });
  }, [engineStatus, setEngineStatus, setEngineError]);

  return { engineStatus };
}
