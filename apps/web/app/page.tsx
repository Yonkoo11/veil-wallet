"use client";

import { useEffect } from "react";
import { useWalletStore } from "./store";
import { Onboarding } from "./components/onboarding";
import { LoginScreen } from "./components/login";
import { Dashboard } from "./components/dashboard";
import { Creating } from "./components/creating";
import { ShieldScreen } from "./components/shield";
import { SendScreen } from "./components/send";
import { ReceiveScreen } from "./components/receive";
import { SwapScreen } from "./components/swap";
import { UnshieldScreen } from "./components/unshield";
import { ErrorBoundary } from "./components/error-boundary";

export default function Home() {
  const screen = useWalletStore((s) => s.screen);
  const isInitializing = useWalletStore((s) => s.isInitializing);
  const setInitializing = useWalletStore((s) => s.setInitializing);
  const setScreen = useWalletStore((s) => s.setScreen);

  useEffect(() => {
    const checkExistingWallet = async () => {
      try {
        const { checkWalletExists } = await import("@veil/core");
        const exists = await checkWalletExists();
        if (exists) {
          setScreen("login");
        }
      } catch {
        // No wallet found, stay on onboarding
      }
      setInitializing(false);
    };

    checkExistingWallet();
  }, [setInitializing, setScreen]);

  if (isInitializing) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <div className="animate-pulse text-neutral-500 text-sm">Loading...</div>
      </main>
    );
  }

  return (
    <ErrorBoundary>
      <main className="min-h-dvh max-w-md mx-auto">
        {screen === "onboarding" && <Onboarding />}
        {screen === "login" && <LoginScreen />}
        {screen === "creating" && <Creating />}
        {screen === "dashboard" && <Dashboard />}
        {screen === "shield" && <ShieldScreen />}
        {screen === "send" && <SendScreen />}
        {screen === "receive" && <ReceiveScreen />}
        {screen === "swap" && <SwapScreen />}
        {screen === "unshield" && <UnshieldScreen />}
      </main>
    </ErrorBoundary>
  );
}
