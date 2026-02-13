"use client";

import { useState } from "react";
import { useWalletStore } from "../store";
import { useRailgunEngine } from "../hooks/use-railgun-engine";

export function LoginScreen() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAuthenticated = useWalletStore((s) => s.setAuthenticated);
  const setScreen = useWalletStore((s) => s.setScreen);
  const { engineStatus } = useRailgunEngine();

  const handleUnlock = async () => {
    if (password.length < 8) return;

    setLoading(true);
    setError(null);

    try {
      // Wait for engine if still initializing
      if (engineStatus === "initializing") {
        setError("Privacy engine is still loading. Please wait...");
        setLoading(false);
        return;
      }

      const authSecret = new TextEncoder().encode(password);
      setPassword("");

      const { loadWallet } = await import("@veil/core");
      const result = await loadWallet(authSecret);

      setAuthenticated(
        result.smartWalletAddress,
        result.railgunAddress,
        result.walletId,
        result.railgunEncryptionKey,
      );
    } catch (err) {
      console.error("Unlock failed:", err);
      setError(err instanceof Error ? err.message : "Failed to unlock wallet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6">
      <div className="w-full max-w-xs">
        <div className="text-center mb-10 fade-in">
          <h1 className="text-2xl font-semibold mb-2">Welcome back</h1>
          <p className="text-sm text-neutral-500">
            Enter your password to unlock
          </p>
        </div>

        <label htmlFor="login-password" className="sr-only">Password</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
          placeholder="Password"
          autoFocus
          className="w-full px-4 py-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 mb-4 focus:border-indigo-500 focus:outline-none fade-in delay-1"
        />

        {error && (
          <p className="text-xs text-red-400 mb-4 fade-in" role="alert">{error}</p>
        )}

        <button
          onClick={handleUnlock}
          disabled={password.length < 8 || loading}
          className="w-full py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors fade-in delay-2"
        >
          {loading ? "Unlocking..." : "Unlock"}
        </button>

        <button
          onClick={() => setScreen("onboarding")}
          className="w-full py-3 mt-3 text-xs text-neutral-500 hover:text-neutral-400 transition-colors fade-in delay-3"
        >
          Create new wallet instead
        </button>
      </div>
    </div>
  );
}
