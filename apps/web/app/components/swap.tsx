"use client";

import { useState, useEffect, useRef } from "react";
import { useWalletStore } from "../store";
import { useProofWorker } from "../hooks/use-proof-worker";
import { useBroadcast } from "../hooks/use-broadcast";
import { TxProgress } from "./tx-progress";
import { POLYGON_TOKENS, parseTokenAmount, type Token } from "@/lib/tokens";

type Phase = "form" | "quoting" | "proving" | "submitting" | "success" | "error";

export function SwapScreen() {
  const setScreen = useWalletStore((s) => s.setScreen);
  const walletId = useWalletStore((s) => s.walletId);
  const railgunAddress = useWalletStore((s) => s.railgunAddress);
  const privateBalances = useWalletStore((s) => s.privateBalances);

  const [sellToken, setSellToken] = useState<Token>(POLYGON_TOKENS[1]);
  const [buyToken, setBuyToken] = useState<Token>(POLYGON_TOKENS[3]);
  const [sellAmount, setSellAmount] = useState("");
  const [buyEstimate, setBuyEstimate] = useState<string | null>(null);
  const [swapQuote, setSwapQuote] = useState<Record<string, unknown> | null>(null);
  const [phase, setPhase] = useState<Phase>("form");
  const [txError, setTxError] = useState<string | null>(null);
  const broadcastStarted = useRef(false);

  const { generateProof, progress, result, error, isGenerating, cancel } =
    useProofWorker();
  const { broadcast, txHash, broadcastError } = useBroadcast();

  const availableBalance = privateBalances.find(
    (b) => b.address.toLowerCase() === sellToken.address.toLowerCase(),
  )?.balance;

  const handleGetQuote = async () => {
    if (!sellAmount) return;
    setPhase("quoting");

    try {
      const apiKey = process.env.NEXT_PUBLIC_0X_API_KEY;
      const parsedAmount = parseTokenAmount(sellAmount, sellToken.decimals);

      if (apiKey) {
        const { getSwapQuote } = await import("@veil/core");
        const quote = await getSwapQuote(
          "polygon",
          sellToken.address as `0x${string}`,
          buyToken.address as `0x${string}`,
          parsedAmount,
          apiKey,
        );
        const { formatTokenAmount } = await import("@/lib/tokens");
        setBuyEstimate(formatTokenAmount(quote.buyAmount, buyToken.decimals));
        setSwapQuote(quote as unknown as Record<string, unknown>);
      } else {
        await new Promise((r) => setTimeout(r, 500));
        const mockRate = sellToken.symbol === "USDC" ? 0.00035 : 2800;
        setBuyEstimate(
          (parseFloat(sellAmount) * mockRate).toFixed(
            buyToken.decimals > 8 ? 6 : 2,
          ),
        );
        setSwapQuote(null);
      }
      setPhase("form");
    } catch (err) {
      setTxError(err instanceof Error ? err.message : "Quote failed");
      setPhase("error");
    }
  };

  const handleSwap = () => {
    if (!sellAmount || !buyEstimate || !walletId) return;
    broadcastStarted.current = false;
    setPhase("proving");
    generateProof("swap", {
      chain: "polygon",
      walletId,
      quote: swapQuote,
      recipientZkAddress: railgunAddress,
      feeRecipient: "0x0000000000000000000000000000000000000000",
      feeBasisPoints: 85,
    });
  };

  useEffect(() => {
    if (phase === "proving" && result && !broadcastStarted.current) {
      broadcastStarted.current = true;
      setPhase("submitting");
      broadcast("private", result);
    }
  }, [phase, result, broadcast]);

  useEffect(() => {
    if (phase === "proving" && error && !isGenerating) {
      setTxError(error);
      setPhase("error");
    }
  }, [phase, error, isGenerating]);

  useEffect(() => {
    if (phase === "submitting" && txHash) setPhase("success");
    if (phase === "submitting" && broadcastError) {
      setTxError(broadcastError);
      setPhase("error");
    }
  }, [phase, txHash, broadcastError]);

  if (phase === "proving" || phase === "submitting" || phase === "success" || phase === "error") {
    return (
      <div className="flex flex-col min-h-dvh px-4 py-6">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => { cancel(); setPhase("form"); }}
            className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center hover:bg-neutral-800 active:bg-neutral-700 transition-colors"
          >
            <span aria-hidden="true">←</span>
          </button>
          <h2 className="text-lg font-semibold">Swap</h2>
        </div>
        <TxProgress
          title={`Swapping ${sellAmount} ${sellToken.symbol} → ${buyToken.symbol}`}
          progress={progress}
          status={
            phase === "proving" ? "generating"
            : phase === "submitting" ? "submitting"
            : phase === "success" ? "success"
            : "error"
          }
          error={txError}
          txHash={txHash}
          onDone={() => setScreen("dashboard")}
          onRetry={() => { setTxError(null); setPhase("form"); }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh px-4 py-6">
      <div className="flex items-center gap-3 mb-8 fade-in">
        <button
          onClick={() => setScreen("dashboard")}
          className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center hover:bg-neutral-800 active:bg-neutral-700 transition-colors"
        >
          <span aria-hidden="true">←</span>
        </button>
        <h2 className="text-lg font-semibold">Private Swap</h2>
      </div>

      <p className="text-sm text-neutral-500 mb-6 fade-in delay-1">
        Swap tokens privately. Unshield, swap on DEX, re-shield atomically.
      </p>

      <label className="text-xs text-neutral-500 mb-2 fade-in delay-2">You sell</label>
      <div className="flex gap-2 mb-4 fade-in delay-2">
        <select
          value={sellToken.address}
          onChange={(e) => {
            const t = POLYGON_TOKENS.find((t) => t.address === e.target.value);
            if (t) { setSellToken(t); setBuyEstimate(null); setSwapQuote(null); }
          }}
          className="w-28 px-3 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 focus:border-indigo-500 focus:outline-none"
        >
          {POLYGON_TOKENS.filter((t) => !t.isNative).map((token) => (
            <option key={token.address} value={token.address}>{token.symbol}</option>
          ))}
        </select>
        <input
          type="text"
          inputMode="decimal"
          value={sellAmount}
          onChange={(e) => { setSellAmount(e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1")); setBuyEstimate(null); setSwapQuote(null); }}
          placeholder="0.00"
          className="flex-1 px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 focus:border-indigo-500 focus:outline-none"
        />
      </div>
      {availableBalance && (
        <p className="text-xs text-neutral-500 mb-4">
          Private balance: {availableBalance} {sellToken.symbol}
        </p>
      )}

      <div className="flex justify-center my-2 fade-in delay-3">
        <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500">
          ↓
        </div>
      </div>

      <label className="text-xs text-neutral-500 mb-2 mt-2 fade-in delay-3">You receive</label>
      <div className="flex gap-2 mb-6 fade-in delay-3">
        <select
          value={buyToken.address}
          onChange={(e) => {
            const t = POLYGON_TOKENS.find((t) => t.address === e.target.value);
            if (t) { setBuyToken(t); setBuyEstimate(null); setSwapQuote(null); }
          }}
          className="w-28 px-3 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 focus:border-indigo-500 focus:outline-none"
        >
          {POLYGON_TOKENS.filter((t) => !t.isNative && t.address !== sellToken.address).map((token) => (
            <option key={token.address} value={token.address}>{token.symbol}</option>
          ))}
        </select>
        <div className="flex-1 px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className={buyEstimate ? "text-neutral-200" : "text-neutral-500"}>
            {buyEstimate || "Get quote first"}
          </span>
        </div>
      </div>

      {!buyEstimate ? (
        <button
          onClick={handleGetQuote}
          disabled={!sellAmount || parseFloat(sellAmount) <= 0 || phase === "quoting"}
          className="w-full py-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-200 font-medium transition-colors mt-auto fade-in delay-4"
        >
          {phase === "quoting" ? "Getting quote..." : "Get Quote"}
        </button>
      ) : (
        <button
          onClick={handleSwap}
          className="w-full py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white font-medium transition-colors mt-auto fade-in delay-4"
        >
          Swap Privately
        </button>
      )}

      <p className="text-xs text-neutral-500 text-center mt-4">
        0.85% fee on swap output
      </p>
    </div>
  );
}
