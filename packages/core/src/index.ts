// Types
export type {
  Hex,
  Address,
  RailgunAddress,
  SupportedChain,
  TokenBalance,
  WalletState,
  ViewKey,
  ProofProgress,
  BroadcasterStatus,
} from './types';
export { CHAIN_IDS } from './types';

// Key management
export {
  deriveMasterSeed,
  deriveEncryptionKey,
  deriveRailgunEncryptionKey,
  deriveOwnerKeyBytes,
  deriveMnemonicEntropy,
  zeroize,
} from './keys/derive';
export { encrypt, decrypt, encryptJSON, decryptJSON } from './keys/encrypt';
export {
  setEncrypted,
  getEncrypted,
  setEncryptedJSON,
  getEncryptedJSON,
  setPublic,
  getPublic,
  remove,
  clearAll,
} from './keys/storage';
export {
  generateViewKey,
  serializeViewKey,
  deserializeViewKey,
} from './keys/viewkeys';

// Railgun privacy operations
export { initEngine, isEngineInitialized } from './railgun/engine';
export { prepareShield } from './railgun/shield';
export { prepareTransfer } from './railgun/transfer';
export { prepareUnshield } from './railgun/unshield';
export { getSwapQuote, prepareSwap } from './railgun/swap';
export { broadcastShield, broadcastPrivate } from './railgun/broadcast';
export { getPrivateBalances, scanBalances, fullResync } from './railgun/scan';

// Wallet
export { createWallet, loadWallet, checkWalletExists } from './wallet/create';
export { setupRecovery, initiateRecovery } from './wallet/recovery';
