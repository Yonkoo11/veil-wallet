/**
 * Wallet creation: Railgun privacy wallet + EOA address.
 *
 * Flow:
 * 1. Derive all keys from auth secret (password or passkey)
 * 2. Create Railgun wallet from mnemonic entropy
 * 3. Derive EOA address from owner key
 * 4. Encrypt and store everything in IndexedDB
 *
 * ERC-4337 smart wallet (ZeroDev) will be added in Phase 2.
 */

import {
  deriveMasterSeed,
  deriveEncryptionKey,
  deriveRailgunEncryptionKey,
  deriveOwnerKeyBytes,
  deriveMnemonicEntropy,
  zeroize,
} from '../keys/derive';
import { setEncryptedJSON, getEncryptedJSON, getPublic } from '../keys/storage';
import type { Address, RailgunAddress, SupportedChain, WalletState } from '../types';

export interface CreateWalletResult {
  smartWalletAddress: Address;
  railgunAddress: RailgunAddress;
  walletId: string;
  railgunEncryptionKey: string;
  chain: SupportedChain;
}

export interface WalletSecrets {
  mnemonic: string;
  ownerKeyHex: string;
  smartWalletAddress: string;
  railgunAddress: string;
}

/**
 * Shared wallet-building logic used by both createWallet and importWallet.
 * Takes a pre-derived masterSeed and a mnemonic (generated or imported).
 */
async function _buildWallet(
  masterSeed: Uint8Array,
  mnemonic: string,
  chain: SupportedChain,
): Promise<CreateWalletResult> {
  const encKey = await deriveEncryptionKey(masterSeed);
  const railgunEncKey = await deriveRailgunEncryptionKey(masterSeed);
  const ownerKeyBytes = await deriveOwnerKeyBytes(masterSeed);

  // Create Railgun wallet (requires engine to be initialized)
  const { createRailgunWallet } = await import('@railgun-community/wallet');
  const railgunWallet = await createRailgunWallet(
    railgunEncKey,
    mnemonic,
    { Polygon: 0 },
  );

  // Derive EOA address from owner key via viem
  const ownerKeyHex = `0x${Array.from(new Uint8Array(ownerKeyBytes)).map(b => b.toString(16).padStart(2, '0')).join('')}` as `0x${string}`;
  const { privateKeyToAccount } = await import('viem/accounts');
  const smartWalletAddress = privateKeyToAccount(ownerKeyHex).address as Address;
  const railgunAddress = railgunWallet.railgunAddress as RailgunAddress;
  const walletId = railgunWallet.id;

  // Encrypt and store wallet secrets
  const walletSecrets: WalletSecrets = {
    mnemonic,
    ownerKeyHex,
    smartWalletAddress,
    railgunAddress,
  };
  await setEncryptedJSON('wallet-secrets', walletSecrets, encKey);

  const walletState: WalletState = {
    smartWalletAddress,
    railgunAddress,
    encryptedMnemonic: new ArrayBuffer(0),
    encryptedOwnerKey: new ArrayBuffer(0),
    chain,
    createdAt: Date.now(),
  };
  await setEncryptedJSON('wallet-state', walletState, encKey);

  // Store walletId and railgunEncKey unencrypted (needed before unlock)
  const { setPublic } = await import('../keys/storage');
  await setPublic('wallet-id', walletId);
  await setPublic('railgun-enc-key', railgunEncKey);
  await setPublic('wallet-exists', true);

  return { smartWalletAddress, railgunAddress, walletId, railgunEncryptionKey: railgunEncKey, chain };
}

/**
 * Create a new Veil wallet from an authentication secret.
 *
 * The auth secret comes from a password (v1) or passkey PRF (v2).
 * All keys are derived deterministically, so the same auth secret
 * always produces the same wallet.
 */
export async function createWallet(
  authSecret: Uint8Array,
  chain: SupportedChain = 'polygon',
): Promise<CreateWalletResult> {
  const masterSeed = await deriveMasterSeed(authSecret);

  try {
    const mnemonicEntropy = await deriveMnemonicEntropy(masterSeed);
    const { Mnemonic } = await import('ethers');
    const mnemonic = Mnemonic.fromEntropy(mnemonicEntropy).phrase;

    return await _buildWallet(masterSeed, mnemonic, chain);
  } finally {
    zeroize(masterSeed);
  }
}

/**
 * Import an existing wallet using a BIP39 mnemonic phrase.
 *
 * The mnemonic restores the same Railgun 0zk address. The password
 * (authSecret) protects storage on this device -- a different password
 * produces a different EOA address but the same privacy address.
 */
export async function importWallet(
  authSecret: Uint8Array,
  mnemonic: string,
  chain: SupportedChain = 'polygon',
): Promise<CreateWalletResult> {
  const words = mnemonic.trim().split(/\s+/);
  if (words.length !== 12) {
    throw new Error('Mnemonic must be exactly 12 words');
  }

  const masterSeed = await deriveMasterSeed(authSecret);

  try {
    return await _buildWallet(masterSeed, mnemonic.trim(), chain);
  } finally {
    zeroize(masterSeed);
  }
}

/**
 * Check if a wallet has been created on this device.
 */
export async function checkWalletExists(): Promise<boolean> {
  const exists = await getPublic<boolean>('wallet-exists');
  return exists === true;
}

/**
 * Load an existing wallet by re-deriving keys from the auth secret.
 * Used on app restart to restore session without re-creating the Railgun wallet.
 */
export async function loadWallet(
  authSecret: Uint8Array,
): Promise<CreateWalletResult> {
  const masterSeed = await deriveMasterSeed(authSecret);

  try {
    const encKey = await deriveEncryptionKey(masterSeed);

    // Load encrypted wallet secrets
    const secrets = await getEncryptedJSON<WalletSecrets>('wallet-secrets', encKey);
    if (!secrets) {
      throw new Error('No wallet found. Create a wallet first.');
    }

    // Load walletId from public storage
    const walletId = await getPublic<string>('wallet-id');
    if (!walletId) {
      throw new Error('Wallet ID not found. Re-create wallet.');
    }

    // Re-create the Railgun wallet from stored mnemonic (idempotent)
    const railgunEncKey = await deriveRailgunEncryptionKey(masterSeed);
    const { createRailgunWallet } = await import('@railgun-community/wallet');
    const railgunWallet = await createRailgunWallet(
      railgunEncKey,
      secrets.mnemonic,
      { Polygon: 0 },
    );

    return {
      smartWalletAddress: secrets.smartWalletAddress as Address,
      railgunAddress: secrets.railgunAddress as RailgunAddress,
      walletId: railgunWallet.id,
      railgunEncryptionKey: railgunEncKey,
      chain: 'polygon',
    };
  } finally {
    zeroize(masterSeed);
  }
}
