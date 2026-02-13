"use client";

import { useState } from "react";
import { useWalletStore } from "../store";

export function ReceiveScreen() {
  const smartWalletAddress = useWalletStore((s) => s.smartWalletAddress);
  const railgunAddress = useWalletStore((s) => s.railgunAddress);
  const setScreen = useWalletStore((s) => s.setScreen);
  const [copied, setCopied] = useState<"public" | "private" | null>(null);

  const copyAddress = async (address: string, type: "public" | "private") => {
    await navigator.clipboard.writeText(address);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex flex-col min-h-dvh px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => setScreen("dashboard")}
          className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center hover:bg-neutral-800 transition-colors"
        >
          <span className="text-sm">←</span>
        </button>
        <h2 className="text-lg font-semibold">Receive</h2>
      </div>

      {/* Public Address */}
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-neutral-400">Public Address</p>
          <span className="text-xs text-neutral-600">ERC-20 tokens</span>
        </div>
        <p className="text-sm font-mono text-neutral-200 break-all mb-3">
          {smartWalletAddress || "---"}
        </p>
        <button
          onClick={() => smartWalletAddress && copyAddress(smartWalletAddress, "public")}
          className="w-full py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-sm text-neutral-300 transition-colors"
        >
          {copied === "public" ? "Copied!" : "Copy Address"}
        </button>
      </div>

      {/* Private Address */}
      <div className="rounded-2xl bg-neutral-900 border border-indigo-500/30 p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-indigo-400">
            Private Address (0zk)
          </p>
          <span className="text-xs text-neutral-600">Shielded transfers</span>
        </div>
        <p className="text-sm font-mono text-indigo-300 break-all mb-3">
          {railgunAddress || "---"}
        </p>
        <button
          onClick={() => railgunAddress && copyAddress(railgunAddress, "private")}
          className="w-full py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-sm text-indigo-300 transition-colors"
        >
          {copied === "private" ? "Copied!" : "Copy Private Address"}
        </button>
      </div>

      {/* Info */}
      <div className="rounded-xl bg-neutral-900/50 border border-neutral-800/50 p-4 mt-2">
        <p className="text-xs text-neutral-500 leading-relaxed">
          <strong className="text-neutral-400">Public address:</strong> Send any
          ERC-20 tokens here. They will appear in your public balance.
        </p>
        <p className="text-xs text-neutral-500 leading-relaxed mt-2">
          <strong className="text-indigo-400">Private address (0zk):</strong>{" "}
          Share this for fully private transfers. Only other Railgun-compatible
          wallets can send to this address.
        </p>
      </div>
    </div>
  );
}
