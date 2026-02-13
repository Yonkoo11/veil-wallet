export type Hex = `0x${string}`;
export type Address = `0x${string}`;
export type RailgunAddress = `0zk${string}`;

export type SupportedChain = 'ethereum' | 'polygon' | 'arbitrum';

export const CHAIN_IDS: Record<SupportedChain, number> = {
  ethereum: 1,
  polygon: 137,
  arbitrum: 42161,
} as const;

export interface TokenBalance {
  token: Address;
  symbol: string;
  decimals: number;
  balance: bigint;
}

export interface WalletState {
  smartWalletAddress: Address;
  railgunAddress: RailgunAddress;
  encryptedMnemonic: ArrayBuffer;
  encryptedOwnerKey: ArrayBuffer;
  chain: SupportedChain;
  createdAt: number;
}

export interface ViewKey {
  type: 'full' | 'balance' | 'single';
  key: string;
  walletAddress: RailgunAddress;
  chainId: number;
  txHash?: string;
}

export interface ProofProgress {
  stage: 'generating' | 'submitting' | 'confirming';
  progress: number; // 0-100
}

export type BroadcasterStatus = 'connected' | 'searching' | 'offline';
