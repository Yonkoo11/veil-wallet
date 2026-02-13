"use client";

import { useCallback, useEffect, useRef } from "react";
import { useWalletStore } from "../store";
import { POLYGON_TOKENS, formatTokenAmount, type Token } from "@/lib/tokens";

const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

interface BalanceEntry {
  symbol: string;
  name: string;
  balance: string;
  usdValue: string;
  address: string;
  decimals: number;
}

/**
 * Hook that fetches public and private token balances.
 * Polls every 30 seconds when active.
 */
export function useBalances() {
  const address = useWalletStore((s) => s.smartWalletAddress);
  const isAuthenticated = useWalletStore((s) => s.isAuthenticated);
  const setPublicBalances = useWalletStore((s) => s.setPublicBalances);
  const setPrivateBalances = useWalletStore((s) => s.setPrivateBalances);
  const setScanning = useWalletStore((s) => s.setScanning);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const fetchPublicBalances = useCallback(async () => {
    if (!address) return;

    try {
      const { createPublicClient, http } = await import("viem");
      const { polygon } = await import("viem/chains");

      const client = createPublicClient({
        chain: polygon,
        transport: http(process.env.NEXT_PUBLIC_POLYGON_RPC_URL),
      });

      const balances: BalanceEntry[] = [];

      for (const token of POLYGON_TOKENS) {
        try {
          let rawBalance: bigint;

          if (token.isNative) {
            rawBalance = await client.getBalance({
              address: address as `0x${string}`,
            });
          } else {
            rawBalance = (await client.readContract({
              address: token.address as `0x${string}`,
              abi: ERC20_ABI,
              functionName: "balanceOf",
              args: [address as `0x${string}`],
            })) as bigint;
          }

          if (rawBalance > BigInt(0)) {
            balances.push(tokenToBalance(token, rawBalance));
          }
        } catch {
          // Skip tokens that fail to read
        }
      }

      setPublicBalances(balances);
    } catch (err) {
      console.error("Failed to fetch public balances:", err);
    }
  }, [address, setPublicBalances]);

  const walletId = useWalletStore((s) => s.walletId);
  const engineStatus = useWalletStore((s) => s.engineStatus);

  const fetchPrivateBalances = useCallback(async () => {
    if (!walletId || engineStatus !== "ready") {
      setPrivateBalances([]);
      return;
    }

    try {
      setScanning(true);
      const { getPrivateBalances } = await import("@veil/core");
      const rawBalances = await getPrivateBalances(walletId, "polygon");

      const balances: BalanceEntry[] = rawBalances.map((b) => {
        const token = POLYGON_TOKENS.find(
          (t) => t.address.toLowerCase() === b.token.toLowerCase(),
        );
        return {
          symbol: token?.symbol || b.token.slice(0, 6),
          name: token?.name || "Unknown",
          balance: formatTokenAmount(b.balance, token?.decimals || b.decimals),
          usdValue: "0.00",
          address: b.token,
          decimals: token?.decimals || b.decimals,
        };
      });

      setPrivateBalances(balances);
    } catch (err) {
      console.error("Failed to fetch private balances:", err);
    } finally {
      setScanning(false);
    }
  }, [walletId, engineStatus, setPrivateBalances, setScanning]);

  const refresh = useCallback(async () => {
    await Promise.all([fetchPublicBalances(), fetchPrivateBalances()]);
  }, [fetchPublicBalances, fetchPrivateBalances]);

  useEffect(() => {
    if (!isAuthenticated || !address) return;

    // Initial fetch
    refresh();

    // Poll every 30 seconds
    intervalRef.current = setInterval(refresh, 30_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, address, refresh]);

  return { refresh };
}

function tokenToBalance(token: Token, rawBalance: bigint): BalanceEntry {
  return {
    symbol: token.symbol,
    name: token.name,
    balance: formatTokenAmount(rawBalance, token.decimals),
    usdValue: "0.00", // TODO: Price feed integration
    address: token.address,
    decimals: token.decimals,
  };
}
