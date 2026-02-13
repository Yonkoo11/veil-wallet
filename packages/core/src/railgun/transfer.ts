/**
 * Private transfer: send shielded tokens to another 0zk address.
 *
 * On-chain, only nullifiers (spent UTXOs) and new commitments are visible.
 * The sender, receiver, and amount are encrypted.
 * Transaction is submitted via broadcaster to hide the sender's public address.
 */

import type { Address, RailgunAddress, SupportedChain } from '../types';

export interface TransferParams {
  chain: SupportedChain;
  walletId: string;
  tokenAddress: Address;
  amount: bigint;
  recipientZkAddress: RailgunAddress;
  broadcasterFeeTokenAddress?: Address;
  onProgress?: (progress: number) => void;
}

export interface TransferResult {
  transactionData: unknown;
  proof: unknown;
}

/**
 * Generate a private transfer proof and prepare the transaction.
 *
 * CPU-intensive (~30s). Run in Web Worker.
 */
export async function prepareTransfer(
  params: TransferParams,
): Promise<TransferResult> {
  const { generateTransferProof, generateTransact } = await import(
    '@railgun-community/wallet'
  );

  const transferInputs = {
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

  const { proof } = await generateTransferProof(
    params.walletId,
    transferInputs,
    (progress: number) => params.onProgress?.(progress * 100),
  );

  const { transaction } = await generateTransact(
    params.chain,
    params.walletId,
    transferInputs,
    proof,
  );

  return { transactionData: transaction, proof };
}
