"use client";

import { useState } from "react";
import { useWalletStore } from "../store";

export function Onboarding() {
  const setScreen = useWalletStore((s) => s.setScreen);
  const setPendingAuthSecret = useWalletStore((s) => s.setPendingAuthSecret);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setError(null);
    const authSecret = new TextEncoder().encode(password);
    setPendingAuthSecret(authSecret);
    setPassword(""); // clear from state immediately
    setScreen("creating");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 py-12">
      {/* Logo */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Veil</h1>
        <p className="text-neutral-500 text-sm mt-1">Private by default</p>
      </div>

      {/* Value props */}
      <div className="space-y-6 mb-10 w-full">
        <Feature
          title="Shielded Transactions"
          desc="ZK-SNARK privacy for every transfer and swap"
        />
        <Feature
          title="No Seed Phrase"
          desc="Password-based key derivation. One password, deterministic wallet."
        />
        <Feature
          title="Smart Wallet"
          desc="Account abstraction with social recovery. No gas tokens needed."
        />
      </div>

      {/* Password input */}
      <div className="w-full mb-4">
        <label htmlFor="onboard-password" className="sr-only">Password</label>
        <input
          id="onboard-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="Choose a strong password"
          className="w-full px-4 py-3.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-neutral-200 placeholder:text-neutral-500"
          autoComplete="new-password"
        />
        {error && (
          <p className="text-red-400 text-xs mt-2" role="alert">{error}</p>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={handleCreate}
        disabled={!password}
        className="w-full py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors"
      >
        Create Wallet
      </button>

      <button
        onClick={() => {
          // TODO: Import existing wallet flow
          setScreen("creating");
        }}
        className="w-full py-3.5 rounded-xl border border-neutral-800 hover:border-neutral-700 active:bg-neutral-900 text-neutral-300 font-medium mt-3 transition-colors"
      >
        Import Existing
      </button>

      <p className="text-neutral-500 text-xs mt-6 text-center">
        Non-custodial. Your keys never leave this device.
      </p>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-1.5 w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
      <div>
        <p className="text-sm font-medium text-neutral-200">{title}</p>
        <p className="text-sm text-neutral-500">{desc}</p>
      </div>
    </div>
  );
}
