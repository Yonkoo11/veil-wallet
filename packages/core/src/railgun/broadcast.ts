/**
 * Transaction broadcasting.
 *
 * Shield transactions go directly to RPC (the deposit is public anyway).
 * Transfer/unshield/swap transactions go through a Railgun broadcaster
 * to hide the sender's public address.
 *
 * For v1, all transactions go directly to RPC. Broadcaster integration
 * will be added when we run our own broadcaster node.
 */

import type { SupportedChain } from '../types';

export interface BroadcastParams {
  chain: SupportedChain;
  serializedTransaction: string;
}

export interface BroadcastResult {
  txHash: string;
}

const RPC_URLS: Record<SupportedChain, string> = {
  polygon: 'https://polygon-rpc.com',
  ethereum: 'https://eth.llamarpc.com',
  arbitrum: 'https://arb1.arbitrum.io/rpc',
};

/**
 * Submit a shield transaction directly to the RPC.
 * Shield txs don't need a broadcaster since the deposit is public.
 */
export async function broadcastShield(
  params: BroadcastParams,
): Promise<BroadcastResult> {
  const { createWalletClient, http } = await import('viem');
  const { polygon, mainnet, arbitrum } = await import('viem/chains');

  const chainMap = { polygon, ethereum: mainnet, arbitrum };
  const chain = chainMap[params.chain];
  const rpcUrl = typeof globalThis !== 'undefined' && 'NEXT_PUBLIC_POLYGON_RPC_URL' in (globalThis as Record<string, unknown>)
    ? (globalThis as Record<string, unknown>).NEXT_PUBLIC_POLYGON_RPC_URL as string
    : RPC_URLS[params.chain];

  const tx = JSON.parse(params.serializedTransaction);

  const client = createWalletClient({
    chain,
    transport: http(rpcUrl),
  });

  const hash = await client.sendRawTransaction({
    serializedTransaction: tx.transactionData as `0x${string}`,
  });

  return { txHash: hash };
}

/**
 * Submit a private transaction via Railgun broadcaster.
 * For v1, falls back to direct RPC submission.
 * Broadcaster integration will be added in Phase 2.
 */
export async function broadcastPrivate(
  params: BroadcastParams,
): Promise<BroadcastResult> {
  // Phase 2: Connect to Railgun broadcaster via Waku P2P
  // For now, submit directly (less private but functional)
  return broadcastShield(params);
}
