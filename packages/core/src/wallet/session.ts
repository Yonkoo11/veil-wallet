/**
 * Session key management for agent wallets (Phase 2).
 *
 * Session keys are limited-permission keys that:
 * - Have spending limits
 * - Auto-expire after a time period
 * - Can only interact with approved contracts
 */

// Stub for Phase 2
export interface SessionKeyConfig {
  spendingLimit: bigint;
  expirySeconds: number;
  allowedContracts: string[];
}

export async function createSessionKey(
  _config: SessionKeyConfig,
): Promise<string> {
  throw new Error('Session keys are Phase 2');
}
