# Veil

Product requirements for MVP.

## Overview

| | |
|---|---|
| Product | Veil |
| Tagline | Private by default |
| Timeline | 12 weeks (Phase 1 MVP) |
| Success | 500 wallets created, $100K shielded volume, swap revenue covers infrastructure |

## Problem

Every blockchain transaction is public. Sender, receiver, amount, timing - all visible to anyone. This creates real harm:

- **Whales get robbed.** 50+ physical attacks on crypto holders in 2025. Gangs use on-chain data to identify targets, locate homes, abduct family members.
- **Traders get front-run.** $1.8B extracted from Ethereum users by MEV bots since 2020. 2,000 sandwich attacks per day.
- **Businesses leak strategy.** Competitors see procurement, payroll, treasury moves in real time.
- **AI agents broadcast everything.** 50M+ agent transactions on x402. Every one is public. Enterprise agents leaking competitive intelligence by default.

Privacy tools exist (Railgun: $108M TVL, Zcash, Aztec) but they have poor UX, require technical knowledge, and aren't integrated into the agent economy at all.

## Solution

Veil is a privacy layer for blockchain transactions. Two products, one engine:

1. **Veil Wallet (PWA)** - A web wallet where every transaction is private by default. One-tap shielding of USDC/ETH. Private swaps. View keys for tax/compliance. No seed phrase (smart wallet with social recovery).

2. **Veil Agent SDK** - Drop-in privacy for AI agents. One npm install. Compatible with Coinbase AgentKit and x402. Every agent payment becomes invisible on-chain.

Both built on Railgun (production ZK privacy) + ERC-4337 smart wallets.

## Target Users

### Phase 1: Humans

**Primary: The Exposed Whale**
- Holds >$100K on-chain
- Knows their addresses are linked to their identity
- Fears physical attacks (50+ wrench attacks in 2025)
- Currently juggles fresh wallets and Monero. Wants DeFi access with privacy.
- Will pay: Yes (survival motivation)

**Secondary: The MEV Refugee**
- Active DeFi user losing money to sandwich attacks
- Currently uses Flashbots Protect (80% of ETH txns) but wants more
- Wants private swaps, hidden positions
- Will pay: Via swap fees (generates volume)

**Tertiary: The Compliance-Conscious Institution**
- Fund or DAO managing on-chain treasury
- 76% plan to expand crypto exposure, only 32% use privacy tools
- Needs privacy + auditability (view keys)
- Will pay: Enterprise pricing

### Phase 2: Agents

**Enterprise Agent Fleet**
- Company deploying hundreds of AI agents making purchases/trades
- All transactions public on Base/Ethereum - competitors can reverse-engineer strategy
- Needs private payments, spending limits, audit trails via view keys
- Will pay: SDK licensing ($99-999/mo per org)

## Features

### 1. Smart Wallet Creation

No seed phrase. No MetaMask extension. User creates a wallet in 30 seconds.

| Step | Action |
|---|---|
| 1 | Land on veil.app |
| 2 | Click "Create Wallet" |
| 3 | Choose recovery method: email + passkey, or social guardians |
| 4 | Wallet deploys as ERC-4337 smart contract on Polygon |
| 5 | Receive public address + private 0zk address |
| 6 | Ready to receive funds |

Technical: Deploys counterfactual ERC-4337 wallet via ZeroDev or Alchemy Account Kit. Contract only deployed on first transaction (saves gas). Social recovery via guardian addresses.

### 2. Shield Assets (Deposit to Privacy Pool)

User converts public tokens into private shielded balance.

| Supported Tokens | Chains |
|---|---|
| USDC, USDT, WETH, ETH, DAI | Ethereum, Polygon, Arbitrum |

Flow:
1. User has USDC in their wallet (public)
2. Taps "Shield"
3. Selects amount
4. ZK proof generated in browser (~30 seconds)
5. Transaction submitted via Railgun broadcaster (sender address hidden)
6. USDC now in private 0zk balance

What happens on-chain: Tokens are deposited into Railgun smart contract. A SNARK proof is generated proving the deposit without revealing the depositor. The user receives a private UTXO commitment.

### 3. Private Transfers

Send tokens to anyone without revealing sender, receiver, or amount on-chain.

Flow:
1. User has shielded USDC balance
2. Taps "Send"
3. Enters recipient's 0zk address or generates a one-time address
4. Enters amount
5. ZK proof generated (~30 seconds)
6. Broadcaster submits transaction
7. Recipient sees private balance update

On-chain visibility: A Railgun transaction appears from the broadcaster address. The amount, sender, and receiver are encrypted. Only the sender and receiver can decrypt.

### 4. Unshield Assets (Withdraw from Privacy Pool)

Convert private balance back to public tokens at any address.

Flow:
1. User taps "Unshield"
2. Enters destination address (can be any 0x address, not necessarily their own)
3. Selects amount
4. ZK proof generated
5. Tokens appear at destination address

Privacy note: The destination address receives tokens from the Railgun contract, not from the user's public address. No on-chain link between source and destination.

### 5. Private Swaps

Swap tokens within the privacy pool without exposing the trade.

Flow:
1. User has shielded WETH
2. Taps "Swap"
3. Selects WETH -> USDC
4. Sees price quote (via 0x or 1inch aggregation)
5. Confirms swap
6. Railgun Relay Adapt: unshields -> executes swap on DEX -> re-shields result
7. User now has shielded USDC

All steps happen atomically in one transaction. The DEX interaction is visible but cannot be linked to the user.

Our fee: 0.85% on swap amount (industry standard, matches Phantom/MetaMask).

### 6. View Keys

Generate read-only keys for compliance, tax reporting, or auditing.

Types:
- **Full view key**: See all transaction history (for accountants/tax)
- **Balance view key**: See current balance only (for proof of funds)
- **Transaction-specific key**: Prove a single transaction occurred

Flow:
1. User goes to Settings > View Keys
2. Selects view key type
3. Key generated client-side
4. User shares key with auditor/accountant
5. Auditor can verify using Veil's public verification page (no login needed)

### 7. Fiat On-Ramp

Buy crypto with card/bank transfer, directly into shielded balance.

Flow:
1. User taps "Buy"
2. MoonPay widget opens
3. User completes purchase (KYC handled by MoonPay)
4. Crypto arrives in public wallet
5. Auto-shield prompt: "Shield your USDC?" -> one tap
6. Funds move to private balance

Our revenue: 0.5-1.25% affiliate cut from MoonPay on every purchase.

### 8. Private Proofs of Innocence (PPOI)

Built into Railgun. Every shielded transaction automatically generates a proof that funds didn't originate from sanctioned addresses. This happens client-side without revealing transaction details.

Why it matters: Prevents the product from being used for money laundering while preserving privacy. Regulators see compliance, users keep privacy.

## Out of Scope (v1)

| Feature | Reason |
|---|---|
| Agent SDK | Phase 2 (after human wallet validates) |
| PQC signatures | Phase 2 (not needed for MVP privacy, adds complexity) |
| Native mobile app | PWA first; native adds app store risk + 2-3 months |
| Multi-chain bridging | Complex, wait for Railgun/Aztec cross-chain support |
| Token/governance | No token. Revenue from fees. |
| NFT privacy | Low priority, add later |
| Custom privacy pools | Use Railgun's existing pool (larger anonymity set) |
| Dark mode | PWA default to system preference |
| Social features | Not a social app. Privacy first. |

## User Flows

### First-Time Setup (2 min)

1. Land on veil.app
2. Click "Create Wallet"
3. Authenticate with passkey (fingerprint/face) or email magic link
4. Wallet created (counterfactual - not deployed yet)
5. See dashboard: empty balance, 0zk address displayed
6. Option: "Fund Your Wallet" -> MoonPay or receive from external address
7. First deposit triggers actual smart contract deployment

### Shield and Send (3 min)

1. User has 100 USDC in public wallet
2. Taps "Shield All" on dashboard
3. Proof generates (progress bar, ~30 seconds)
4. Broadcaster submits tx (~15 seconds for confirmation)
5. Dashboard shows: "100 USDC (Private)"
6. Taps "Send" -> enters recipient 0zk address
7. Enters 50 USDC
8. Proof generates (~30 seconds)
9. Transaction confirmed
10. Dashboard: "50 USDC (Private)"

### Export View Key for Tax

1. Go to Settings > View Keys
2. Click "Generate Full View Key"
3. Warning: "This key allows anyone to see your complete transaction history. Share only with trusted parties."
4. Key displayed + copy button + QR code
5. Share with accountant
6. Accountant visits veil.app/verify, pastes key
7. Sees full transaction history in read-only mode

### Receive Payment Privately

1. Sender asks for your address
2. User taps "Receive" on dashboard
3. Shows 0zk address + QR code
4. Sender (from any Railgun-compatible wallet) sends to 0zk address
5. User sees incoming private balance (after Merkle tree scan, ~1-5 min)

## Pricing

### Human Wallet
Free to use. Revenue from:
- 0.85% swap fee (on every private swap)
- 0.5-1.25% fiat on-ramp affiliate (on every buy)
- Railgun takes 0.25% shield/unshield fee (not our revenue)

### Agent SDK (Phase 2)

| Tier | Price | Includes |
|---|---|---|
| Developer | Free | 100 private txns/month, 1 agent wallet |
| Startup | $99/mo | 10,000 txns/month, 50 agent wallets |
| Enterprise | $999/mo | Unlimited txns, unlimited wallets, priority support |

### Unit Economics

| Metric | Value |
|---|---|
| Cost per user | ~$0 (non-custodial, client-side) |
| Infrastructure cost | ~$500/mo (RPC, broadcaster, hosting) |
| Swap revenue at $500K monthly volume | ~$4,250/mo |
| Fiat affiliate at $100K monthly buys | ~$500-1,250/mo |
| Break-even | ~$500K monthly swap volume |

## Success Criteria

### Phase 1 (Month 3)

**Primary:** 500+ wallets created, $100K+ total shielded volume.

**Secondary:**
- 50+ daily active users
- Average shield-to-send time under 3 minutes
- Swap revenue covering infrastructure costs (~$500/mo)
- Zero security incidents

### Phase 2 (Month 5)
- 10+ agent integrations using SDK
- 1,000+ total wallets
- $1M+ monthly shielded volume
- 1 enterprise pilot signed

### Phase 3 (Month 8)
- 5,000+ total wallets
- $5M+ monthly shielded volume
- 5+ enterprise customers
- Break-even on all operating costs

## Timeline

| Week | Focus |
|---|---|
| 1-2 | Project setup, smart wallet factory, Railgun SDK browser integration |
| 3-4 | Shield/unshield flow, private transfers, broadcaster integration |
| 5-6 | Private swaps (DEX aggregator), view key system |
| 7-8 | Fiat on-ramp (MoonPay), transaction history, balance scanning |
| 9-10 | PWA polish, settings, security hardening, error handling |
| 11-12 | Landing page, docs, own broadcaster deployment, soft launch |

## Positioning

**What we say:** "Private by default. Your finances are nobody's business."

**What we don't say:** "Anonymous." "Untraceable." "Hide from regulators."

**Compliance messaging:** View keys and PPOI featured on landing page. "Financial privacy with built-in compliance" above the fold.

## Resolved Decisions

1. **PWA over native app.** Railway Wallet (React Native) was rejected by app stores. PWA avoids gatekeepers, has faster ZK proof generation (30s browser WASM vs 1-2 min mobile), and serves desktop+mobile from one codebase.

2. **Railgun over custom ZK.** $108M TVL, production-tested, multi-chain, open source. Building custom ZK circuits would take 6-12 months and produce an inferior anonymity set.

3. **ERC-4337 smart wallet over EOA.** No seed phrase UX disaster. Social recovery. Session keys for agents (Phase 2). PQC-ready signature validation (Phase 2). Confirmed compatible with Railgun (Gnosis Safe integration exists).

4. **L2-first (Polygon + Arbitrum).** Gas costs 50-100x lower than L1. Railgun has liquidity on both. Add Ethereum L1 for whales who want it.

5. **No token.** Revenue from swap fees (0.85%) + fiat affiliate (0.5-1.25%). Token adds regulatory risk, governance overhead, and distraction. Zcash's 2026 governance drama is a cautionary tale.

6. **Run our own broadcaster.** Open source, Docker, 1GB RAM. Adds reliability + small fee revenue. Ensures users always have a working relayer.

7. **Web Crypto API for key storage.** Browser's built-in crypto primitives for key derivation and encryption. IndexedDB for encrypted wallet state. Not as secure as native keychain, but sufficient for a non-custodial wallet where keys are derived from passkey/password.
