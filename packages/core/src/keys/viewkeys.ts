/**
 * View key generation for compliance, tax, and auditing.
 *
 * Types:
 * - Full view key: see all transaction history
 * - Balance view key: see current balances only
 * - Single-tx key: prove a specific transaction occurred
 */

import type { ViewKey, RailgunAddress } from '../types';

/**
 * Generate a view key from the Railgun wallet.
 */
export async function generateViewKey(
  walletId: string,
  type: ViewKey['type'],
  chainId: number,
  walletAddress: RailgunAddress,
  txHash?: string,
): Promise<ViewKey> {
  const { getWalletShareableViewingKey } = await import(
    '@railgun-community/wallet'
  );

  const viewingKey = getWalletShareableViewingKey(walletId);

  return {
    type,
    key: viewingKey,
    walletAddress,
    chainId,
    ...(type === 'single' && txHash ? { txHash } : {}),
  };
}

/**
 * Serialize a view key for sharing (QR code, copy/paste).
 */
export function serializeViewKey(viewKey: ViewKey): string {
  return btoa(JSON.stringify(viewKey));
}

/**
 * Deserialize a shared view key.
 */
export function deserializeViewKey(encoded: string): ViewKey {
  return JSON.parse(atob(encoded)) as ViewKey;
}
