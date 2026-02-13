/**
 * Private swap via Railgun Relay Adapt.
 *
 * Atomic flow: unshield -> DEX swap -> re-shield
 * The DEX interaction is visible but cannot be linked to the user.
 * Veil takes 0.85% fee on swap output.
 */

import type { Address, RailgunAddress, SupportedChain } from '../types';

export interface SwapQuote {
  sellToken: Address;
  buyToken: Address;
  sellAmount: bigint;
  buyAmount: bigint;
  to: Address; // DEX router
  data: string; // Swap calldata
  value: bigint;
}

export interface SwapParams {
  chain: SupportedChain;
  walletId: string;
  quote: SwapQuote;
  recipientZkAddress: RailgunAddress;
  feeRecipient: Address;
  feeBasisPoints: number; // 85 = 0.85%
  onProgress?: (progress: number) => void;
}

export interface SwapResult {
  transactionData: unknown;
  proof: unknown;
}

/**
 * Fetch a swap quote from 0x API.
 */
export async function getSwapQuote(
  chain: SupportedChain,
  sellToken: Address,
  buyToken: Address,
  sellAmount: bigint,
  apiKey: string,
  feeRecipient?: Address,
): Promise<SwapQuote> {
  const chainId = chain === 'polygon' ? 137 : chain === 'arbitrum' ? 42161 : 1;

  const params = new URLSearchParams({
    chainId: chainId.toString(),
    sellToken,
    buyToken,
    sellAmount: sellAmount.toString(),
  });

  if (feeRecipient) {
    params.set('affiliateAddress', feeRecipient);
    params.set('buyTokenPercentageFee', '0.0085');
  }

  const response = await fetch(
    `https://api.0x.org/swap/allowance-holder/quote?${params}`,
    { headers: { '0x-api-key': apiKey } },
  );

  if (!response.ok) {
    throw new Error(`0x API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return {
    sellToken,
    buyToken,
    sellAmount,
    buyAmount: BigInt(data.buyAmount),
    to: data.to as Address,
    data: data.data,
    value: BigInt(data.value || '0'),
  };
}

/**
 * Generate a private swap proof via Relay Adapt cross-contract calls.
 *
 * CPU-intensive (~30s). Run in Web Worker.
 */
export async function prepareSwap(
  params: SwapParams,
): Promise<SwapResult> {
  const { generateCrossContractCallsProof } = await import(
    '@railgun-community/wallet'
  );

  const crossContractCalls = [
    {
      to: params.quote.to,
      data: params.quote.data,
      value: params.quote.value,
    },
  ];

  const { proof } = await generateCrossContractCallsProof(
    params.chain,
    params.walletId,
    [
      {
        tokenAddress: params.quote.sellToken,
        amount: params.quote.sellAmount,
      },
    ],
    crossContractCalls,
    [
      {
        tokenAddress: params.quote.buyToken,
        recipientAddress: params.recipientZkAddress,
      },
    ],
    (progress: number) => params.onProgress?.(progress * 100),
  );

  return { transactionData: proof.transaction, proof };
}
