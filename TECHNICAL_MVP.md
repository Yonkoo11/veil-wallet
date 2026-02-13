# Veil - Technical Specification

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                           VEIL                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     │
│  │  Veil PWA    │────▶│  Veil Core   │────▶│  Railgun     │     │
│  │  (Next.js)   │     │  SDK (TS)    │     │  Wallet SDK  │     │
│  └──────────────┘     └──────────────┘     └──────┬───────┘     │
│         │                    │                     │              │
│         │                    │              ┌──────▼───────┐     │
│         │                    │              │  ZK Prover   │     │
│         │                    │              │  (WASM)      │     │
│         │                    │              └──────┬───────┘     │
│         │                    │                     │              │
│         ▼                    ▼                     ▼              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     │
│  │  ZeroDev     │     │  Waku P2P    │     │  Blockchain  │     │
│  │  (AA Wallet) │     │  (Relayers)  │     │  RPC         │     │
│  └──────────────┘     └──────────────┘     └──────────────┘     │
│         │                    │                     │              │
│         └────────────────────┼─────────────────────┘              │
│                              │                                    │
│                    ┌─────────▼─────────┐                         │
│                    │  EVM Chains       │                         │
│                    │  Polygon │ Arb    │                         │
│                    │  ETH     │ Base*  │                         │
│                    └───────────────────┘                         │
│                                                                   │
│  * Base added Phase 2 for x402 agent compatibility               │
└──────────────────────────────────────────────────────────────────┘
```

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), TypeScript |
| PWA | next-pwa (service worker, offline support) |
| Styling | Tailwind CSS |
| State | Zustand (client state), TanStack Query (async) |
| EVM Interaction | viem + wagmi |
| Smart Wallet | ZeroDev SDK (ERC-4337) |
| Privacy Engine | @railgun-community/wallet, @railgun-community/engine |
| ZK Proofs | Railgun WASM prover (browser-native) |
| Relayer Comms | @railgun-community/waku-broadcaster-client |
| DEX Aggregation | 0x Swap API |
| Fiat On-Ramp | MoonPay SDK |
| Key Derivation | Web Crypto API (PBKDF2, AES-GCM) |
| Local Storage | IndexedDB (via idb-keyval) |
| Auth/Recovery | WebAuthn (passkeys) |
| Hosting | Vercel (PWA), Docker VPS (broadcaster) |
| Monitoring | Sentry |

## Project Structure

```
veil/
├── apps/
│   └── web/                      # Next.js PWA
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx          # Landing page
│       │   ├── wallet/
│       │   │   ├── page.tsx      # Dashboard
│       │   │   ├── send/
│       │   │   ├── receive/
│       │   │   ├── swap/
│       │   │   ├── shield/
│       │   │   └── settings/
│       │   └── verify/
│       │       └── page.tsx      # Public view key verifier
│       ├── components/
│       │   ├── wallet/
│       │   │   ├── BalanceCard.tsx
│       │   │   ├── ShieldButton.tsx
│       │   │   ├── SendForm.tsx
│       │   │   ├── SwapForm.tsx
│       │   │   ├── ProofProgress.tsx
│       │   │   └── TxHistory.tsx
│       │   ├── onboarding/
│       │   │   ├── CreateWallet.tsx
│       │   │   └── RecoverySetup.tsx
│       │   └── ui/               # Shared components
│       ├── hooks/
│       │   ├── useWallet.ts
│       │   ├── useRailgun.ts
│       │   ├── useShield.ts
│       │   ├── usePrivateTransfer.ts
│       │   ├── useSwap.ts
│       │   └── useViewKeys.ts
│       ├── lib/
│       │   ├── railgun.ts        # Railgun SDK init
│       │   ├── wallet.ts         # Smart wallet init
│       │   ├── keys.ts           # Key management
│       │   ├── storage.ts        # Encrypted IndexedDB
│       │   └── broadcaster.ts    # Waku broadcaster client
│       ├── public/
│       │   ├── manifest.json
│       │   └── sw.js
│       ├── next.config.ts
│       └── tailwind.config.ts
│
├── packages/
│   └── core/                     # Shared SDK (used by PWA + future agent SDK)
│       ├── src/
│       │   ├── index.ts
│       │   ├── railgun/
│       │   │   ├── engine.ts     # Railgun engine wrapper
│       │   │   ├── shield.ts     # Shield operations
│       │   │   ├── transfer.ts   # Private transfers
│       │   │   ├── unshield.ts   # Unshield operations
│       │   │   ├── swap.ts       # Private swaps via Relay Adapt
│       │   │   └── scan.ts       # Balance/UTXO scanning
│       │   ├── wallet/
│       │   │   ├── create.ts     # Smart wallet creation
│       │   │   ├── recovery.ts   # Social recovery
│       │   │   └── session.ts    # Session key management
│       │   ├── keys/
│       │   │   ├── derive.ts     # Key derivation from passkey
│       │   │   ├── encrypt.ts    # AES-GCM encryption
│       │   │   ├── viewkeys.ts   # View key generation/export
│       │   │   └── storage.ts    # Platform-agnostic storage interface
│       │   └── types/
│       │       └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── contracts/                    # Smart contracts (if needed beyond ZeroDev)
│   ├── src/
│   │   └── VeilWalletFactory.sol
│   ├── test/
│   └── foundry.toml
│
├── broadcaster/                  # Our own Railgun broadcaster
│   ├── docker-compose.yml
│   ├── config.ts
│   └── README.md
│
├── turbo.json
├── package.json
├── .env.example
└── .gitignore
```

## Key Management

### Overview

Veil is non-custodial. Keys are derived client-side, encrypted, and stored in the browser. The server never sees private keys.

### Key Hierarchy

```
User Authentication (passkey or password)
  │
  ├── Master Seed (derived via PBKDF2 from auth secret)
  │     │
  │     ├── Railgun Spending Key (for ZK proof generation)
  │     │     └── Railgun Viewing Key (derived from spending key)
  │     │           └── 0zk Address (derived from viewing key)
  │     │
  │     └── Smart Wallet Owner Key (ECDSA, for ERC-4337 UserOps)
  │           └── Controls the smart contract wallet
  │
  └── Encryption Key (for local storage encryption)
```

### Key Generation Flow

```typescript
async function createWallet(authSecret: Uint8Array) {
  // 1. Derive master seed from passkey/password
  const masterSeed = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
    await crypto.subtle.importKey('raw', authSecret, 'PBKDF2', false, ['deriveBits']),
    256
  );

  // 2. Derive Railgun spending key (BIP39 mnemonic from seed)
  const mnemonic = entropyToMnemonic(masterSeed);

  // 3. Create Railgun wallet (SDK handles viewing key + 0zk address derivation)
  const railgunWallet = await createRailgunWallet(
    encryptionKey,
    mnemonic,
    { [NetworkName.Polygon]: 0 } // scan from block 0
  );

  // 4. Derive smart wallet owner key (different derivation path)
  const ownerKey = deriveECDSAKey(masterSeed, "m/44'/60'/0'/0/0");

  // 5. Deploy counterfactual smart wallet via ZeroDev
  const smartWallet = await createKernelAccount(publicClient, {
    plugins: { sudo: signerToEcdsaValidator(ownerKey) },
    entryPoint: ENTRYPOINT_ADDRESS_V07,
  });

  // 6. Encrypt and store
  const encKey = await deriveEncryptionKey(masterSeed);
  await encryptedStore.set('wallet', encrypt(encKey, {
    mnemonic, // Railgun wallet recovery
    ownerKey, // Smart wallet control
    smartWalletAddress: smartWallet.address,
    railgunAddress: railgunWallet.zkAddress,
  }));
}
```

### Storage Security (PWA)

| Data | Storage | Encryption |
|---|---|---|
| Encrypted wallet blob | IndexedDB | AES-256-GCM (key from passkey) |
| Railgun Merkle tree cache | IndexedDB | Unencrypted (public data) |
| Transaction history | IndexedDB | AES-256-GCM |
| User preferences | localStorage | Unencrypted |
| Session token | sessionStorage | Cleared on tab close |

### Recovery

**Passkey recovery:** If device is lost, user authenticates with synced passkey (iCloud Keychain, Google Password Manager) on new device. Key derivation reproduces same master seed.

**Social recovery (ERC-4337):** If passkey is lost entirely, guardian addresses (friends/family) can authorize a new owner key on the smart wallet contract. Requires n-of-m guardian signatures.

**Manual backup:** User can export encrypted backup file. Decrypted with password. Contains mnemonic + owner key.

### Threat Model

| Threat | Mitigation |
|---|---|
| XSS stealing keys | Keys only decrypted when needed, zeroed after use. CSP headers. Subresource integrity. |
| Compromised CDN | Integrity hashes on all scripts. Users can self-host (open source). |
| IndexedDB theft (physical access) | Encrypted with AES-256-GCM derived from passkey. |
| Broadcaster sees transaction | Impossible. Broadcasters only see encrypted data. Modifying it invalidates the ZK proof. |
| Railgun contract vulnerability | Risk accepted. Railgun is audited. Not our code. Users can unshield to exit. |
| Quantum attack on ECDSA keys | Phase 2: hybrid ECDSA + ML-DSA signatures. Phase 1: acceptable risk (quantum computers years away). |
| Correlation analysis | Timing attacks mitigated by batched broadcaster submissions. Amount analysis mitigated by Railgun's UTXO model. |

## Data Flows

### Shield (Public -> Private)

```
User clicks "Shield 100 USDC"
  │
  ▼
1. Veil Core validates balance (viem: read USDC balance of smart wallet)
  │
  ▼
2. Generate ERC-20 approval for Railgun contract
   (UserOp: smartWallet.approve(RAILGUN_PROXY, 100 USDC))
  │
  ▼
3. Railgun SDK generates shield proof (WASM, ~30 seconds)
   - Input: token, amount, recipient 0zk address
   - Output: ZK-SNARK proof + encrypted commitment
  │
  ▼
4. Populate shield transaction
   (calldata for Railgun.shield() with proof)
  │
  ▼
5. Wrap in UserOperation
   - sender: smart wallet address
   - callData: shield transaction
   - paymaster: optional (gasless on Polygon)
  │
  ▼
6. Submit via Bundler (ZeroDev/Alchemy)
   OR submit via Railgun broadcaster (hides smart wallet address)
  │
  ▼
7. Transaction confirmed on-chain
  │
  ▼
8. Railgun Merkle tree updated
  │
  ▼
9. Client scans for new UTXOs (finds the shielded balance)
  │
  ▼
10. Dashboard updates: "100 USDC (Private)"
```

### Private Transfer

```
User sends 50 USDC to recipient 0zk address
  │
  ▼
1. Railgun SDK finds unspent UTXOs covering 50 USDC
  │
  ▼
2. Generate transfer proof (WASM, ~30 seconds)
   - Inputs: spending key, UTXOs, recipient 0zk address, amount
   - Outputs: proof, nullifiers (marks UTXOs as spent), new commitments
  │
  ▼
3. Calculate broadcaster fee (~10% of gas cost, paid in USDC from private balance)
  │
  ▼
4. Query Waku network for available broadcasters
   (WakuBroadcasterClient.findBestBroadcaster())
  │
  ▼
5. Send encrypted transaction to selected broadcaster
  │
  ▼
6. Broadcaster validates fee, submits to blockchain
   (tx appears from BROADCASTER address, not user)
  │
  ▼
7. On-chain: nullifiers published (old UTXOs spent), new commitments created
  │
  ▼
8. Recipient scans Merkle tree, finds new UTXO
  │
  ▼
9. Both parties see updated balances
```

### Private Swap (via Relay Adapt)

```
User swaps 1 WETH -> USDC privately
  │
  ▼
1. Get swap quote from 0x API (best price across DEXes)
  │
  ▼
2. Railgun SDK generates cross-contract call proof:
   Step A: Unshield 1 WETH to Relay Adapt contract
   Step B: Relay Adapt executes 0x swap (WETH -> USDC on Uniswap/etc)
   Step C: Re-shield USDC output back to user's 0zk address
  │
  ▼
3. All steps encoded as single proof (~30 seconds)
  │
  ▼
4. Add 0.85% Veil fee to swap (taken from output before re-shield)
  │
  ▼
5. Submit via broadcaster
  │
  ▼
6. On-chain: Relay Adapt contract unshields, swaps, re-shields atomically
  │
  ▼
7. User sees: -1 WETH (private), +X USDC (private) minus 0.85% fee
```

## Client-Side State

### Zustand Store

```typescript
interface VeilStore {
  // Wallet state
  walletAddress: string | null;       // ERC-4337 smart wallet
  railgunAddress: string | null;      // 0zk address
  isUnlocked: boolean;

  // Balances
  publicBalances: TokenBalance[];     // On-chain ERC-20 balances
  privateBalances: TokenBalance[];    // Railgun shielded UTXOs
  pendingBalances: TokenBalance[];    // Awaiting PPOI confirmation

  // Network
  chain: SupportedChain;             // polygon | arbitrum | ethereum
  broadcasterStatus: 'connected' | 'searching' | 'offline';

  // UI state
  proofProgress: number | null;       // 0-100 during proof generation
  lastScanBlock: number;

  // Actions
  unlock: (authSecret: Uint8Array) => Promise<void>;
  lock: () => void;
  shield: (token: Address, amount: bigint) => Promise<TxHash>;
  send: (to: RailgunAddress, token: Address, amount: bigint) => Promise<TxHash>;
  unshield: (to: Address, token: Address, amount: bigint) => Promise<TxHash>;
  swap: (from: Address, to: Address, amount: bigint) => Promise<TxHash>;
  scanBalances: () => Promise<void>;
}
```

### What's Stored Locally (IndexedDB)

| Key | Data | Encrypted? |
|---|---|---|
| `wallet` | Mnemonic, owner key, addresses | Yes (AES-256-GCM) |
| `railgun-merkle-*` | Merkle tree state per chain | No (public data, large) |
| `railgun-utxos` | User's UTXO set | Yes |
| `tx-history` | Transaction metadata | Yes |
| `preferences` | Chain selection, display currency | No |

### What's NOT Stored Locally

- Private keys in plaintext (only decrypted in memory when needed)
- Transaction details on any server
- User identity or KYC data
- Analytics or telemetry

## Railgun SDK Integration

### Initialization

```typescript
import {
  startRailgunEngine,
  getProver,
  loadProvider,
} from '@railgun-community/wallet';
import { ArtifactStore } from '@railgun-community/shared-models';

// Custom artifact store using IndexedDB
const artifactStore = new ArtifactStore(
  async (path) => {
    // Download proving artifacts from CDN on first use
    const response = await fetch(`https://artifacts.veil.app/${path}`);
    return new Uint8Array(await response.arrayBuffer());
  },
  async (path, data) => {
    await idbSet(`artifact-${path}`, data);
  },
  async (path) => {
    return await idbGet(`artifact-${path}`);
  }
);

export async function initRailgun() {
  // Start engine (WASM prover loads here)
  await startRailgunEngine(
    'veil-wallet',           // wallet source identifier
    indexedDBPath,           // database path for Merkle trees
    false,                   // shouldDebug
    artifactStore,
    false,                   // useNativeArtifacts (false = WASM for browser)
    false,                   // skipMerkletreeScans
  );

  // Load chain providers
  await loadProvider(
    { chainId: 137 },        // Polygon
    'polygon',
    POLYGON_RPC_URL,
    10                        // polling interval seconds
  );

  await loadProvider(
    { chainId: 42161 },      // Arbitrum
    'arbitrum',
    ARBITRUM_RPC_URL,
    10
  );
}
```

### Shield Operation

```typescript
import {
  generateShieldProof,
  populateShield,
} from '@railgun-community/wallet';

export async function shield(
  wallet: RailgunWallet,
  chain: Chain,
  token: Address,
  amount: bigint,
  onProgress: (progress: number) => void
): Promise<TransactionRequest> {
  // 1. Generate proof
  const shieldInputs = {
    networkName: chain,
    erc20AmountRecipients: [{
      tokenAddress: token,
      amount,
      recipientAddress: wallet.zkAddress,
    }],
    nftAmountRecipients: [],
  };

  const { proof } = await generateShieldProof(
    shieldInputs,
    (progress) => onProgress(progress * 100)
  );

  // 2. Populate transaction
  const { transaction } = await populateShield(
    chain,
    wallet.zkAddress,
    shieldInputs,
    proof
  );

  return transaction;
}
```

### Broadcaster Integration

```typescript
import { WakuBroadcasterClient } from '@railgun-community/waku-broadcaster-client';

let broadcasterClient: WakuBroadcasterClient;

export async function initBroadcaster(chain: NetworkName) {
  broadcasterClient = new WakuBroadcasterClient(
    chain,
    (status) => {
      // Update store with broadcaster status
      useVeilStore.setState({ broadcasterStatus: status });
    }
  );

  await broadcasterClient.start();
}

export async function submitViaBroadcaster(
  transaction: TransactionRequest,
  feeTokenAddress: Address,
  chain: NetworkName
): Promise<TxHash> {
  // Find broadcaster with lowest fee
  const broadcaster = await broadcasterClient.findBestBroadcaster(
    chain,
    feeTokenAddress,
    true // use reliability score
  );

  if (!broadcaster) {
    throw new Error('No broadcasters available. Try self-relay or wait.');
  }

  // Submit transaction
  const txHash = await broadcasterClient.broadcast(
    transaction,
    broadcaster,
    feeTokenAddress
  );

  return txHash;
}
```

## Smart Wallet Integration

### ZeroDev Setup

```typescript
import { createKernelAccount, createKernelAccountClient } from '@zerodev/sdk';
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import { ENTRYPOINT_ADDRESS_V07 } from 'permissionless';

export async function createSmartWallet(ownerKey: PrivateKeyAccount) {
  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    signer: ownerKey,
    entryPoint: ENTRYPOINT_ADDRESS_V07,
  });

  const account = await createKernelAccount(publicClient, {
    plugins: { sudo: ecdsaValidator },
    entryPoint: ENTRYPOINT_ADDRESS_V07,
  });

  const client = createKernelAccountClient({
    account,
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    chain: polygon,
    bundlerTransport: http(ZERODEV_BUNDLER_URL),
    middleware: {
      sponsorUserOperation: async ({ userOperation }) => {
        // Paymaster sponsors gas (optional, for onboarding)
        return paymasterClient.sponsorUserOperation({ userOperation });
      },
    },
  });

  return { account, client };
}

// Execute Railgun shield via smart wallet
export async function executeShieldUserOp(
  client: KernelAccountClient,
  shieldTx: TransactionRequest
) {
  const hash = await client.sendUserOperation({
    userOperation: {
      callData: await client.account.encodeCallData({
        to: shieldTx.to,
        value: shieldTx.value ?? 0n,
        data: shieldTx.data,
      }),
    },
  });

  return hash;
}
```

## Private Swap Integration

### 0x API + Railgun Relay Adapt

```typescript
import { generateCrossContractCallsProof } from '@railgun-community/wallet';

export async function privateSwap(
  wallet: RailgunWallet,
  chain: NetworkName,
  sellToken: Address,
  buyToken: Address,
  sellAmount: bigint,
  onProgress: (p: number) => void
): Promise<TxHash> {
  // 1. Get swap quote from 0x
  const quote = await fetch(
    `https://api.0x.org/swap/v1/quote?` +
    `sellToken=${sellToken}&buyToken=${buyToken}&sellAmount=${sellAmount}` +
    `&affiliateAddress=${VEIL_FEE_ADDRESS}&buyTokenPercentageFee=0.0085`,
    { headers: { '0x-api-key': ZEROX_API_KEY } }
  ).then(r => r.json());

  // 2. Build Relay Adapt cross-contract call
  // Step A: Unshield sellToken to Relay Adapt
  // Step B: Approve DEX router
  // Step C: Execute swap (0x calldata)
  // Step D: Re-shield buyToken output
  const crossContractCalls = [
    {
      to: quote.to,         // DEX router
      data: quote.data,     // Swap calldata
      value: quote.value,
    }
  ];

  // 3. Generate proof for entire flow
  const { proof } = await generateCrossContractCallsProof(
    chain,
    wallet,
    [{
      tokenAddress: sellToken,
      amount: sellAmount,
    }],
    crossContractCalls,
    [{
      tokenAddress: buyToken,
      recipientAddress: wallet.zkAddress,
    }],
    (progress) => onProgress(progress * 100)
  );

  // 4. Submit via broadcaster
  const txHash = await submitViaBroadcaster(
    proof.transaction,
    sellToken,  // pay broadcaster fee in sell token
    chain
  );

  return txHash;
}
```

## View Key System

```typescript
import {
  getRailgunWalletViewingKey,
  getRailgunWalletTransactionHistory,
} from '@railgun-community/wallet';

export function generateViewKey(
  wallet: RailgunWallet,
  type: 'full' | 'balance' | 'single',
  txHash?: string
): ViewKey {
  const viewingKey = getRailgunWalletViewingKey(wallet.id);

  return {
    type,
    key: viewingKey,
    walletAddress: wallet.zkAddress,
    chainId: wallet.chain,
    // For single-tx keys, include tx reference
    ...(type === 'single' && txHash ? { txHash } : {}),
  };
}

// Public verification page (no auth required)
export async function verifyViewKey(viewKey: ViewKey): Promise<VerificationResult> {
  // Initialize read-only Railgun engine
  const readOnlyWallet = await loadRailgunWalletByViewKey(viewKey.key, viewKey.chainId);

  if (viewKey.type === 'balance') {
    const balances = await scanBalances(readOnlyWallet);
    return { type: 'balance', balances };
  }

  if (viewKey.type === 'full') {
    const history = await getRailgunWalletTransactionHistory(readOnlyWallet.id);
    return { type: 'full', transactions: history };
  }

  if (viewKey.type === 'single' && viewKey.txHash) {
    const tx = await getTransactionByHash(readOnlyWallet, viewKey.txHash);
    return { type: 'single', transaction: tx };
  }
}
```

## Error Handling

### Proof Generation Failures

```typescript
async function shieldWithRetry(params: ShieldParams): Promise<TxHash> {
  try {
    const proof = await generateShieldProof(params);
    return await submitViaBroadcaster(proof.transaction);
  } catch (error) {
    if (error.message.includes('insufficient artifacts')) {
      // Re-download proving artifacts
      await clearArtifactCache();
      await downloadArtifacts();
      // Retry once
      const proof = await generateShieldProof(params);
      return await submitViaBroadcaster(proof.transaction);
    }

    if (error.message.includes('out of memory')) {
      // WASM OOM - suggest closing other tabs
      throw new UserError(
        'Not enough memory to generate proof. Close other browser tabs and try again.'
      );
    }

    throw error;
  }
}
```

### Broadcaster Failures

```typescript
async function submitWithFallback(tx: TransactionRequest): Promise<TxHash> {
  // Try broadcaster first (private)
  try {
    return await submitViaBroadcaster(tx);
  } catch (broadcasterError) {
    console.warn('Broadcaster failed:', broadcasterError);

    // Fallback: try our own broadcaster
    try {
      return await submitViaOwnBroadcaster(tx, OWN_BROADCASTER_URL);
    } catch (ownBroadcasterError) {
      console.warn('Own broadcaster failed:', ownBroadcasterError);

      // Last resort: self-relay (less private - links tx to smart wallet)
      const confirmed = await promptUser(
        'No broadcasters available. Submit directly? ' +
        'This links this transaction to your public wallet address.'
      );

      if (confirmed) {
        return await submitViaSelfRelay(tx);
      }

      throw new UserError('Transaction cancelled. No broadcaster available.');
    }
  }
}
```

### Balance Scan Failures

```typescript
async function scanWithRecovery(): Promise<void> {
  try {
    await scanBalances();
  } catch (error) {
    if (error.message.includes('RPC')) {
      // Switch to backup RPC
      await switchRPC(BACKUP_RPC_URL);
      await scanBalances();
      return;
    }

    if (error.message.includes('merkle')) {
      // Corrupted local Merkle tree - resync
      await clearMerkleCache();
      await fullResync(); // Slow but recovers state
      return;
    }

    throw error;
  }
}
```

### Principles

1. Never lose user funds due to transient errors
2. Always provide a degraded path (broadcaster -> own broadcaster -> self-relay)
3. ZK proof failures are retryable (same inputs always produce same proof)
4. If Merkle tree is corrupted, full resync recovers state (on-chain data is truth)
5. Show clear error messages with actionable next steps

## Environment Variables

```bash
# App
NEXT_PUBLIC_APP_URL=https://veil.app

# RPC Providers
NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/KEY
NEXT_PUBLIC_ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/KEY
NEXT_PUBLIC_ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/KEY

# ZeroDev (ERC-4337)
NEXT_PUBLIC_ZERODEV_PROJECT_ID=
ZERODEV_BUNDLER_URL=https://rpc.zerodev.app/api/v2/bundler/PROJECT_ID
ZERODEV_PAYMASTER_URL=https://rpc.zerodev.app/api/v2/paymaster/PROJECT_ID

# 0x Swap API
ZEROX_API_KEY=

# MoonPay
NEXT_PUBLIC_MOONPAY_API_KEY=
MOONPAY_SECRET_KEY=

# Veil Broadcaster (our own)
BROADCASTER_MNEMONIC=             # NEVER commit this
BROADCASTER_DB_ENCRYPTION_KEY=
BROADCASTER_EXTERNAL_IP=

# Veil Fee Collection
NEXT_PUBLIC_VEIL_FEE_ADDRESS=     # Address receiving 0.85% swap fees

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=

# Railgun Artifacts CDN
NEXT_PUBLIC_ARTIFACTS_URL=https://artifacts.veil.app
```

## Deployment

### PWA (Vercel)

```json
// vercel.json
{
  "buildCommand": "turbo build --filter=web",
  "outputDirectory": "apps/web/.next",
  "framework": "nextjs",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self' https://*.alchemy.com https://*.0x.org wss://*.waku.org https://api.moonpay.com;" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```

### Broadcaster (Docker VPS)

```yaml
# broadcaster/docker-compose.yml
version: '3.8'
services:
  broadcaster:
    build: .
    ports:
      - "60000:60000"
      - "8000:8000"
    environment:
      - MNEMONIC=${BROADCASTER_MNEMONIC}
      - DB_ENCRYPTION_KEY=${BROADCASTER_DB_ENCRYPTION_KEY}
    volumes:
      - broadcaster-data:/data
    restart: unless-stopped

volumes:
  broadcaster-data:
```

Deploy on a $10-20/mo VPS (Hetzner, DigitalOcean). Requirements: 1GB RAM, 20GB storage, Docker.

### Railgun Artifact Hosting

ZK proving artifacts (~50MB total) need to be hosted for download on first wallet use. Options:
- Vercel Edge (fast, free tier covers it)
- Cloudflare R2 (cheap storage, global CDN)
- IPFS (censorship-resistant, slower)

Start with Vercel Edge, add IPFS as fallback.

## Performance Requirements

| Operation | Target | Fallback |
|---|---|---|
| Wallet creation | <3 seconds | N/A |
| ZK proof generation (shield/send) | <45 seconds | 90 seconds max |
| Balance scan (incremental) | <10 seconds | 30 seconds max |
| Balance scan (full resync) | <5 minutes | 15 minutes max |
| Swap quote | <2 seconds | 5 seconds max |
| Broadcaster discovery | <5 seconds | 15 seconds max |
| Transaction confirmation | <30 seconds (Polygon) | 2 minutes max |

## Build Plan

### Weeks 1-2: Foundation

- [ ] Monorepo setup (Turborepo: apps/web + packages/core)
- [ ] Next.js PWA scaffold with Tailwind
- [ ] Railgun SDK browser integration (WASM init, artifact loading)
- [ ] ZeroDev smart wallet creation (passkey auth)
- [ ] Key derivation and encrypted IndexedDB storage
- [ ] Basic dashboard layout (balance card, action buttons)

### Weeks 3-4: Core Privacy

- [ ] Shield flow (ERC-20 approval + proof generation + submit)
- [ ] Unshield flow
- [ ] Private transfer flow
- [ ] Waku broadcaster client integration
- [ ] Proof progress UI (loading bar with cancel)
- [ ] Balance scanning (incremental Merkle tree sync)
- [ ] Multi-chain support (Polygon + Arbitrum)

### Weeks 5-6: Swaps + View Keys

- [ ] 0x API integration (quote + swap calldata)
- [ ] Relay Adapt cross-contract call (private swap flow)
- [ ] 0.85% fee injection in swap output
- [ ] View key generation (full / balance / single-tx)
- [ ] Public verification page (/verify)
- [ ] Transaction history (decrypted from local UTXOs)

### Weeks 7-8: Fiat + Polish

- [ ] MoonPay SDK integration (buy crypto)
- [ ] Auto-shield prompt after fiat purchase
- [ ] Social recovery setup flow
- [ ] Settings page (chain selection, view keys, recovery)
- [ ] Error handling (broadcaster fallback, proof retry, RPC failover)
- [ ] Sentry integration

### Weeks 9-10: Hardening

- [ ] Security audit prep (CSP headers, XSS prevention, key zeroing)
- [ ] PWA manifest, service worker, offline handling
- [ ] Performance optimization (artifact caching, lazy loading)
- [ ] Browser compatibility testing (Chrome, Firefox, Safari, mobile browsers)
- [ ] Load testing (concurrent proof generation)
- [ ] Self-relay fallback implementation

### Weeks 11-12: Launch

- [ ] Deploy own Railgun broadcaster (Docker VPS)
- [ ] Landing page (conversion-focused, compliance messaging)
- [ ] Documentation (user guide, developer docs for future SDK)
- [ ] Deploy to Vercel (production)
- [ ] Soft launch: post to Railgun Discord, r/privacy, r/ethereum
- [ ] Monitor: Sentry errors, broadcaster uptime, proof generation times

## Security Checklist (Pre-Launch)

- [ ] CSP headers block inline scripts and unauthorized domains
- [ ] All key material zeroed from memory after use
- [ ] No private keys or mnemonics in console logs
- [ ] IndexedDB encryption tested (keys not readable without passkey)
- [ ] Social recovery tested (guardian signature flow)
- [ ] Broadcaster can't extract transaction data (verified by code audit)
- [ ] Self-relay warning shown (privacy trade-off explained)
- [ ] PPOI integration verified (sanctioned addresses blocked)
- [ ] Rate limiting on public verification endpoint
- [ ] Subresource integrity hashes on CDN-hosted scripts
