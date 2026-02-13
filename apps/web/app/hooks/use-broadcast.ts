"use client";

import { useCallback, useState } from "react";

interface UseBroadcastReturn {
  broadcast: (type: "shield" | "private", serializedTransaction: string) => Promise<void>;
  txHash: string | null;
  isBroadcasting: boolean;
  broadcastError: string | null;
}

export function useBroadcast(): UseBroadcastReturn {
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);

  const broadcast = useCallback(async (
    type: "shield" | "private",
    serializedTransaction: string,
  ) => {
    setIsBroadcasting(true);
    setBroadcastError(null);

    try {
      if (type === "shield") {
        const { broadcastShield } = await import("@veil/core");
        const result = await broadcastShield({
          chain: "polygon",
          serializedTransaction,
        });
        setTxHash(result.txHash);
      } else {
        const { broadcastPrivate } = await import("@veil/core");
        const result = await broadcastPrivate({
          chain: "polygon",
          serializedTransaction,
        });
        setTxHash(result.txHash);
      }
    } catch (err) {
      setBroadcastError(err instanceof Error ? err.message : "Broadcast failed");
    } finally {
      setIsBroadcasting(false);
    }
  }, []);

  return { broadcast, txHash, isBroadcasting, broadcastError };
}
