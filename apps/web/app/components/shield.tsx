"use client";

import { useState, useEffect, useRef } from "react";
import { useWalletStore } from "../store";
import { useProofWorker } from "../hooks/use-proof-worker";
import { useBroadcast } from "../hooks/use-broadcast";
import { TxProgress } from "./tx-progress";
import { POLYGON_TOKENS, parseTokenAmount, type Token } from "@/lib/tokens";

type Phase = "form" | "proving" | "submitting" | "success" | "error";

export function ShieldScreen() {
  const setScreen = useWalletStore((s) => s.setScreen);
  const railgunAddress = useWalletStore((s) => s.railgunAddress);
  const publicBalances = useWalletStore((s) => s.publicBalances);

  const [selectedToken, setSelectedToken] = useState<Token>(POLYGON_TOKENS[1]);
  const [amount, setAmount] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [txError, setTxError] = useState<string | null>(null);
  const broadcastStarted = useRef(false);

  const { generateProof, progress, result, error, isGenerating, cancel } =
    useProofWorker();
  const { broadcast, txHash, isBroadcasting, broadcastError } = useBroadcast();

  const availableBalance = publicBalances.find(
    (b) => b.address.toLowerCase() === selectedToken.address.toLowerCase(),
  )?.balance;

  const handleShield = () => {
    if (!amount || !railgunAddress) return;
    broadcastStarted.current = false;
    setPhase("proving");
    generateProof("shield", {
      chain: "polygon",
      tokenAddress: selectedToken.address,
      amount: parseTokenAmount(amount, selectedToken.decimals).toString(),
      recipientZkAddress: railgunAddress,
    });
  };

  // Proof completed -> broadcast
  useEffect(() => {
    if (phase === "proving" && result && !broadcastStarted.current) {
      broadcastStarted.current = true;
      setPhase("submitting");
      broadcast("shield", result);
    }
  }, [phase, result, broadcast]);

  // Proof error
  useEffect(() => {
    if (phase === "proving" && error && !isGenerating) {
      setTxError(error);
      setPhase("error");
    }
  }, [phase, error, isGenerating]);

  // Broadcast completed
  useEffect(() => {
    if (phase === "submitting" && txHash) {
      setPhase("success");
    }
    if (phase === "submitting" && broadcastError) {
      setTxError(broadcastError);
      setPhase("error");
    }
  }, [phase, txHash, broadcastError]);

  if (phase !== "form") {
    return (
      <div className="flex flex-col min-h-dvh px-4 py-6">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => { cancel(); setPhase("form"); }}
            className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center hover:bg-neutral-800 active:bg-neutral-700 transition-colors"
          >
            <span aria-hidden="true">←</span>
          </button>
          <h2 className="text-lg font-semibold">Shield</h2>
        </div>
        <TxProgress
          title={`Shielding ${amount} ${selectedToken.symbol}`}
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
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => setScreen("dashboard")}
          className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center hover:bg-neutral-800 active:bg-neutral-700 transition-colors"
        >
          <span aria-hidden="true">←</span>
        </button>
        <h2 className="text-lg font-semibold">Shield Tokens</h2>
      </div>

      <p className="text-sm text-neutral-500 mb-6">
        Move tokens from your public balance into the private pool.
      </p>

      <label className="text-xs text-neutral-500 mb-2">Token</label>
      <select
        value={selectedToken.address}
        onChange={(e) => {
          const token = POLYGON_TOKENS.find((t) => t.address === e.target.value);
          if (token) setSelectedToken(token);
        }}
        className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 text-sm mb-4 focus:border-indigo-500 focus:outline-none"
      >
        {POLYGON_TOKENS.filter((t) => !t.isNative).map((token) => (
          <option key={token.address} value={token.address}>
            {token.symbol} - {token.name}
          </option>
        ))}
      </select>

      <label className="text-xs text-neutral-500 mb-2">Amount</label>
      <div className="relative mb-2">
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"))}
          placeholder="0.00"
          className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 focus:border-indigo-500 focus:outline-none pr-16"
        />
        {availableBalance && (
          <button
            onClick={() => setAmount(availableBalance)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-indigo-400 hover:text-indigo-300"
          >
            MAX
          </button>
        )}
      </div>
      {availableBalance && (
        <p className="text-xs text-neutral-500 mb-6">
          Available: {availableBalance} {selectedToken.symbol}
        </p>
      )}

      <button
        onClick={handleShield}
        disabled={!amount || parseFloat(amount) <= 0}
        className="w-full py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors mt-auto"
      >
        Shield {selectedToken.symbol}
      </button>

      <p className="text-xs text-neutral-500 text-center mt-4">
        Shielding requires a ZK proof (~30 seconds)
      </p>
    </div>
  );
}
