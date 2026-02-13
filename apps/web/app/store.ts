import { create } from "zustand";

type Screen = "onboarding" | "login" | "creating" | "dashboard" | "send" | "receive" | "shield" | "swap" | "unshield";
export type EngineStatus = "idle" | "initializing" | "ready" | "error";

interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  usdValue: string;
  address: string;
  decimals: number;
}

interface WalletStore {
  // Auth state
  isAuthenticated: boolean;
  isInitializing: boolean;

  // Engine state
  engineStatus: EngineStatus;
  engineError: string | null;

  // Wallet creation
  pendingAuthSecret: Uint8Array | null;
  pendingMnemonic: string | null;
  creationError: string | null;

  // Wallet info
  smartWalletAddress: string | null;
  railgunAddress: string | null;
  walletId: string | null;
  railgunEncryptionKey: string | null;
  chain: string;

  // Balances
  publicBalances: TokenBalance[];
  privateBalances: TokenBalance[];
  isScanning: boolean;

  // Navigation
  screen: Screen;

  // Proof generation
  proofProgress: number | null;

  // Actions
  setAuthenticated: (address: string, railgunAddress: string, walletId: string, railgunEncryptionKey: string) => void;
  setScreen: (screen: Screen) => void;
  setPublicBalances: (balances: TokenBalance[]) => void;
  setPrivateBalances: (balances: TokenBalance[]) => void;
  setScanning: (scanning: boolean) => void;
  setProofProgress: (progress: number | null) => void;
  setInitializing: (init: boolean) => void;
  setEngineStatus: (status: EngineStatus) => void;
  setEngineError: (error: string) => void;
  setPendingAuthSecret: (secret: Uint8Array | null) => void;
  setPendingMnemonic: (mnemonic: string | null) => void;
  setCreationError: (error: string | null) => void;
  reset: () => void;
}

export const useWalletStore = create<WalletStore>((set) => ({
  isAuthenticated: false,
  isInitializing: true,
  engineStatus: "idle",
  engineError: null,
  pendingAuthSecret: null,
  pendingMnemonic: null,
  creationError: null,
  smartWalletAddress: null,
  railgunAddress: null,
  walletId: null,
  railgunEncryptionKey: null,
  chain: "polygon",
  publicBalances: [],
  privateBalances: [],
  isScanning: false,
  screen: "onboarding",
  proofProgress: null,

  setAuthenticated: (address, railgunAddress, walletId, railgunEncryptionKey) =>
    set({ isAuthenticated: true, smartWalletAddress: address, railgunAddress, walletId, railgunEncryptionKey, screen: "dashboard" }),
  setScreen: (screen) => set({ screen }),
  setPublicBalances: (publicBalances) => set({ publicBalances }),
  setPrivateBalances: (privateBalances) => set({ privateBalances }),
  setScanning: (isScanning) => set({ isScanning }),
  setProofProgress: (proofProgress) => set({ proofProgress }),
  setInitializing: (isInitializing) => set({ isInitializing }),
  setEngineStatus: (engineStatus) => set({ engineStatus }),
  setEngineError: (error) => set({ engineStatus: "error", engineError: error }),
  setPendingAuthSecret: (pendingAuthSecret) => set({ pendingAuthSecret }),
  setPendingMnemonic: (pendingMnemonic) => set({ pendingMnemonic }),
  setCreationError: (creationError) => set({ creationError }),
  reset: () =>
    set({
      isAuthenticated: false,
      smartWalletAddress: null,
      railgunAddress: null,
      walletId: null,
      railgunEncryptionKey: null,
      publicBalances: [],
      privateBalances: [],
      screen: "onboarding",
      proofProgress: null,
      engineStatus: "idle",
      engineError: null,
      pendingAuthSecret: null,
      pendingMnemonic: null,
      creationError: null,
    }),
}));
