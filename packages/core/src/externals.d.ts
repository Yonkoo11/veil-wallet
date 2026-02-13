// Ambient type declarations for dynamically imported SDKs.
// These packages are loaded at runtime, not bundled.
// Full types come when the actual packages are installed.

/* eslint-disable @typescript-eslint/no-explicit-any */

declare module '@railgun-community/wallet' {
  export function startRailgunEngine(...args: any[]): Promise<void>;
  export function loadProvider(...args: any[]): Promise<void>;
  export function createRailgunWallet(...args: any[]): Promise<{ id: string; railgunAddress: string }>;
  export function getWalletShareableViewingKey(walletId: string): string;
  export function generateShieldTransaction(...args: any[]): Promise<any>;
  export function populateShield(...args: any[]): Promise<any>;
  export function populateShieldBaseToken(...args: any[]): Promise<any>;
  export function gasEstimateForShield(...args: any[]): Promise<any>;
  export function generateTransferProof(...args: any[]): Promise<any>;
  export function generateTransact(...args: any[]): Promise<any>;
  export function generateUnshieldProof(...args: any[]): Promise<any>;
  export function populateProvedUnshield(...args: any[]): Promise<any>;
  export function generateCrossContractCallsProof(...args: any[]): Promise<any>;
  export function balanceForERC20Token(...args: any[]): Promise<any>;
  export function getSerializedERC20Balances(...args: any[]): Promise<any>;
  export function refreshBalances(...args: any[]): Promise<void>;
  export function rescanFullUTXOMerkletreesAndWallets(...args: any[]): Promise<void>;
}

declare module '@railgun-community/shared-models' {
  export enum NetworkName {
    Polygon = 'Polygon',
    Ethereum = 'Ethereum',
    Arbitrum = 'Arbitrum',
  }
  export const NETWORK_CONFIG: Record<string, { name: string; chain: { id: number } }>;
}

declare module 'ethers' {
  export class Mnemonic {
    static fromEntropy(entropy: Uint8Array): Mnemonic;
    readonly phrase: string;
  }
}

declare module 'level-js' {
  class LevelDB {
    constructor(location: string);
  }
  export default LevelDB;
}

declare module 'localforage' {
  interface LocalForageInstance {
    getItem<T>(key: string): Promise<T | null>;
    setItem<T>(key: string, value: T): Promise<T>;
    removeItem(key: string): Promise<void>;
  }
  interface LocalForage extends LocalForageInstance {
    createInstance(config: { name: string }): LocalForageInstance;
  }
  const localforage: LocalForage;
  export default localforage;
}
