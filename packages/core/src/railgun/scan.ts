/**
 * Balance and UTXO scanning.
 *
 * Scans the Railgun Merkle tree for UTXOs belonging to the user's wallet.
 * Incremental scans are fast (~10s), full resyncs can take minutes.
 */

import type { Address, SupportedChain, TokenBalance } from '../types';

/**
 * Get shielded token balances for a wallet.
 */
export async function getPrivateBalances(
  walletId: string,
  chain: SupportedChain,
): Promise<TokenBalance[]> {
  const { getSerializedERC20Balances } = await import(
    '@railgun-community/wallet'
  );

  const balances = await getSerializedERC20Balances(walletId, chain);

  const entries = balances as Record<string, { amount: string }>;
  return Object.entries(entries).map(([tokenAddress, balance]) => ({
    token: tokenAddress as Address,
    symbol: '', // Resolve from token list
    decimals: 18, // Resolve from token list
    balance: BigInt(balance.amount),
  }));
}

/**
 * Trigger a balance scan (incremental).
 * Scans from last known block to current block.
 */
export async function scanBalances(
  walletId: string,
  chain: SupportedChain,
): Promise<void> {
  const { refreshBalances } = await import(
    '@railgun-community/wallet'
  );

  await refreshBalances(walletId, chain);
}

/**
 * Full resync of the Merkle tree. Slow but recovers from corruption.
 */
export async function fullResync(
  walletId: string,
  chain: SupportedChain,
): Promise<void> {
  const { rescanFullUTXOMerkletreesAndWallets } = await import(
    '@railgun-community/wallet'
  );

  await rescanFullUTXOMerkletreesAndWallets(chain, [walletId]);
}
