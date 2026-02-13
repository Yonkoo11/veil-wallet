"use client";

import { useEffect, useRef, useState } from "react";
import { useWalletStore } from "../store";
import { useRailgunEngine } from "../hooks/use-railgun-engine";

const STEPS = [
  { id: "auth", label: "Deriving keys..." },
  { id: "engine", label: "Initializing privacy engine..." },
  { id: "wallet", label: "Creating wallet..." },
  { id: "encrypt", label: "Encrypting storage..." },
  { id: "done", label: "Ready" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export function Creating() {
  const [currentStep, setCurrentStep] = useState<StepId>("auth");
  const [error, setError] = useState<string | null>(null);
  const hasRun = useRef(false);

  const setAuthenticated = useWalletStore((s) => s.setAuthenticated);
  const setScreen = useWalletStore((s) => s.setScreen);
  const pendingAuthSecret = useWalletStore((s) => s.pendingAuthSecret);
  const setPendingAuthSecret = useWalletStore((s) => s.setPendingAuthSecret);
  const { engineStatus } = useRailgunEngine();

  useEffect(() => {
    if (hasRun.current) return;
    if (!pendingAuthSecret) {
      setError("No authentication secret. Go back and try again.");
      return;
    }

    // Wait for engine to be ready (or skip if no RPC configured)
    if (engineStatus === "initializing") {
      setCurrentStep("engine");
      return;
    }

    // Engine error is non-fatal for wallet creation without RPC
    // (can create wallet offline, scan balances later)
    if (engineStatus === "error") {
      // Continue anyway - wallet creation may fail if engine is needed
    }

    if (engineStatus !== "ready" && engineStatus !== "error") return;

    hasRun.current = true;
    const authSecret = pendingAuthSecret;

    const run = async () => {
      try {
        setCurrentStep("wallet");

        const { createWallet } = await import("@veil/core");
        const result = await createWallet(authSecret);

        setCurrentStep("encrypt");
        await new Promise((r) => setTimeout(r, 400));

        setCurrentStep("done");
        await new Promise((r) => setTimeout(r, 500));

        // Clear sensitive material
        setPendingAuthSecret(null);

        setAuthenticated(result.smartWalletAddress, result.railgunAddress, result.walletId, result.railgunEncryptionKey);
      } catch (err) {
        console.error("Wallet creation failed:", err);
        setError(err instanceof Error ? err.message : "Wallet creation failed");
        setPendingAuthSecret(null);
      }
    };

    run();
  }, [engineStatus, pendingAuthSecret, setAuthenticated, setPendingAuthSecret]);

  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh px-6">
        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
          <span className="text-red-400 text-xl">!</span>
        </div>
        <p className="text-red-400 text-sm text-center mb-6 max-w-xs">{error}</p>
        <button
          onClick={() => {
            setError(null);
            hasRun.current = false;
            setScreen("onboarding");
          }}
          className="px-6 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6">
      {/* Spinner */}
      <div className="w-12 h-12 rounded-full border-2 border-neutral-800 border-t-indigo-500 animate-spin mb-8" />

      {/* Steps */}
      <div className="space-y-3 w-full max-w-xs">
        {STEPS.map((step, i) => (
          <div
            key={step.id}
            className={`flex items-center gap-3 text-sm transition-opacity duration-300 ${
              i <= stepIndex ? "opacity-100" : "opacity-20"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                i < stepIndex
                  ? "bg-green-500/20 text-green-400"
                  : i === stepIndex
                    ? "bg-indigo-500/20 text-indigo-400"
                    : "bg-neutral-800"
              }`}
            >
              {i < stepIndex ? "✓" : ""}
            </div>
            <span className={i <= stepIndex ? "text-neutral-200" : "text-neutral-600"}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
