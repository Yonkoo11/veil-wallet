"use client";

import { useState } from "react";
import { useWalletStore } from "../store";

export function Onboarding() {
  const setScreen = useWalletStore((s) => s.setScreen);
  const setPendingAuthSecret = useWalletStore((s) => s.setPendingAuthSecret);
  const setPendingMnemonic = useWalletStore((s) => s.setPendingMnemonic);
  const [mode, setMode] = useState<"create" | "import">("create");
  const [password, setPassword] = useState("");
  const [mnemonic, setMnemonic] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setError(null);
    const authSecret = new TextEncoder().encode(password);
    setPendingAuthSecret(authSecret);
    setPassword("");
    setScreen("creating");
  };

  const handleImport = () => {
    const words = mnemonic.trim().split(/\s+/);
    if (words.length !== 12) {
      setError("Enter exactly 12 words separated by spaces");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setError(null);
    const authSecret = new TextEncoder().encode(password);
    setPendingAuthSecret(authSecret);
    setPendingMnemonic(mnemonic.trim());
    setPassword("");
    setMnemonic("");
    setScreen("creating");
  };

  if (mode === "import") {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh px-6 py-12">
        <div className="mb-8 text-center fade-in">
          <h1 className="text-4xl font-bold tracking-tight">Veil</h1>
          <p className="text-neutral-500 text-sm mt-1">Restore your wallet</p>
        </div>

        <p className="text-sm text-neutral-500 mb-6 text-center fade-in delay-1">
          Enter your 12-word recovery phrase to restore your private address on this device.
        </p>

        <div className="w-full mb-4 fade-in delay-2">
          <label htmlFor="import-mnemonic" className="text-xs text-neutral-500 mb-2 block">Recovery phrase</label>
          <textarea
            id="import-mnemonic"
            value={mnemonic}
            onChange={(e) => setMnemonic(e.target.value.toLowerCase())}
            placeholder="word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-neutral-200 placeholder:text-neutral-500 text-sm resize-none"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>

        <div className="w-full mb-4 fade-in delay-3">
          <label htmlFor="import-password" className="text-xs text-neutral-500 mb-2 block">Device password</label>
          <input
            id="import-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleImport()}
            placeholder="Choose a password for this device"
            className="w-full px-4 py-3.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-neutral-200 placeholder:text-neutral-500"
            autoComplete="new-password"
          />
        </div>

        {error && (
          <p className="text-red-400 text-xs mb-4 text-center" role="alert">{error}</p>
        )}

        <button
          onClick={handleImport}
          disabled={!mnemonic || !password}
          className="w-full py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors fade-in delay-4"
        >
          Import Wallet
        </button>

        <button
          onClick={() => { setMode("create"); setError(null); setMnemonic(""); setPassword(""); }}
          className="w-full py-3.5 rounded-xl border border-neutral-800 hover:border-neutral-700 active:bg-neutral-900 text-neutral-300 font-medium mt-3 transition-colors fade-in delay-4"
        >
          Back to Create
        </button>

        <p className="text-neutral-500 text-xs mt-6 text-center fade-in delay-5">
          Your phrase is only used locally and never sent anywhere.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 py-12">
      {/* Logo */}
      <div className="mb-12 text-center fade-in">
        <h1 className="text-4xl font-bold tracking-tight">Veil</h1>
        <p className="text-neutral-500 text-sm mt-1">Private by default</p>
      </div>

      {/* Value props */}
      <div className="space-y-6 mb-10 w-full fade-in delay-1">
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
      <div className="w-full mb-4 fade-in delay-2">
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
        className="w-full py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors fade-in delay-3"
      >
        Create Wallet
      </button>

      <button
        onClick={() => { setMode("import"); setError(null); setPassword(""); }}
        className="w-full py-3.5 rounded-xl border border-neutral-800 hover:border-neutral-700 active:bg-neutral-900 text-neutral-300 font-medium mt-3 transition-colors fade-in delay-3"
      >
        Import Existing
      </button>

      <p className="text-neutral-500 text-xs mt-6 text-center fade-in delay-4">
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
