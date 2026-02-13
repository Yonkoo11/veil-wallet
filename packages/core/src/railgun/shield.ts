/**
 * Shield operations: move public tokens into Railgun privacy pool.
 *
 * Flow:
 * 1. Approve Railgun contract to spend tokens
 * 2. Generate ZK proof (in Web Worker, ~30 seconds)
 * 3. Submit shield transaction via bundler or broadcaster
 * 4. Tokens are now in the shielded UTXO pool
 */

import type { Address, RailgunAddress, SupportedChain } from '../types';

export interface ShieldParams {
  chain: SupportedChain;
  tokenAddress: Address;
  amount: bigint;
  recipientZkAddress: RailgunAddress;
  onProgress?: (progress: number) => void;
}

export interface ShieldResult {
  transactionData: unknown; // Railgun transaction request
  proof: unknown; // ZK proof
}

/**
 * Generate a shield proof and prepare the transaction.
 *
 * This is CPU-intensive (~30s) and should run in a Web Worker.
 * The onProgress callback reports 0-100 during proof generation.
 */
export async function prepareShield(
  params: ShieldParams,
): Promise<ShieldResult> {
  const { generateShieldTransaction, populateShield } = await import(
    '@railgun-community/wallet'
  );

  const shieldInputs = {
    networkName: params.chain,
    erc20AmountRecipients: [
      {
        tokenAddress: params.tokenAddress,
        amount: params.amount,
        recipientAddress: params.recipientZkAddress,
      },
    ],
    nftAmountRecipients: [],
  };

  const shieldResult = await generateShieldTransaction(
    shieldInputs,
    (progress: number) => params.onProgress?.(progress * 100),
  );

  const { transaction } = await populateShield(
    params.chain,
    params.recipientZkAddress,
    shieldInputs,
    shieldResult,
  );

  return { transactionData: transaction, proof: shieldResult };
}
