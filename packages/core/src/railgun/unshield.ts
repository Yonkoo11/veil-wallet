/**
 * Unshield: withdraw private tokens to any public address.
 *
 * The destination address receives tokens from the Railgun contract,
 * not from the user's public address. No on-chain link between source
 * and destination.
 */

import type { Address, SupportedChain } from '../types';

export interface UnshieldParams {
  chain: SupportedChain;
  walletId: string;
  tokenAddress: Address;
  amount: bigint;
  destinationAddress: Address;
  onProgress?: (progress: number) => void;
}

export interface UnshieldResult {
  transactionData: unknown;
  proof: unknown;
}

export async function prepareUnshield(
  params: UnshieldParams,
): Promise<UnshieldResult> {
  const { generateUnshieldProof, populateProvedUnshield } = await import(
    '@railgun-community/wallet'
  );

  const unshieldInputs = {
    networkName: params.chain,
    erc20AmountRecipients: [
      {
        tokenAddress: params.tokenAddress,
        amount: params.amount,
        recipientAddress: params.destinationAddress,
      },
    ],
    nftAmountRecipients: [],
  };

  const { proof } = await generateUnshieldProof(
    params.walletId,
    unshieldInputs,
    (progress: number) => params.onProgress?.(progress * 100),
  );

  const { transaction } = await populateProvedUnshield(
    params.chain,
    params.walletId,
    unshieldInputs,
    proof,
  );

  return { transactionData: transaction, proof };
}
