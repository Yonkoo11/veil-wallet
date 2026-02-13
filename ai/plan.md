# Veil: Private Transaction Infrastructure for Humans and AI Agents

## Executive Summary

Every major agent payment platform (Coinbase AgentKit, x402, Visa TAP, Fetch.ai) runs on transparent public blockchains. Zero privacy. Every transaction - amount, sender, receiver, timing - is fully visible. Privacy protocols exist (Railgun, Aztec) but aren't integrated into agent frameworks.

**Veil** is a privacy layer that sits between wallet infrastructure and blockchain, making any transaction private by default. For humans: a mobile wallet with one-tap private transfers. For agents: an SDK that wraps AgentKit/x402 with zero-knowledge privacy.

**The bet:** By the time billions of agents are transacting on-chain, privacy won't be a feature request - it'll be table stakes. We build the infrastructure now, while nobody cares.

---

## INVESTIGATION RESULTS (Feb 2026)

### Open Questions - Answered

| Question | Answer | Impact |
|---|---|---|
| Railgun SDK mobile compatibility | Works but Railway Wallet DISCONTINUED mobile due to app store policies. Requires nodejs-mobile-react-native (heavy). | HIGH - must choose: PWA, sideload APK, or solve app store problem |
| ZK proof generation on mobile | 1-2 min on mobile (30s desktop). Client-side via C++ native artifacts. | MEDIUM - acceptable for high-value txns, bad for micropayments |
| ERC-4337 + Railgun | CONFIRMED COMPATIBLE. Already works with Gnosis Safe. V3 adding native ERC-4337 alt-mempool. | GREEN - validates core architecture |
| PQC gas costs on L2 | ML-DSA: $0.004 on Arbitrum (viable). Falcon precompile: $0.000008 (negligible when EIP ships). | GREEN - L2-first confirmed |
| Relayer reliability | Decentralized (Waku P2P), open source, easy to self-host. No single point of failure. | GREEN - run our own for reliability |

### Critical Decision: Mobile Distribution

Railway Wallet was rejected by app stores. Three paths forward:

**Option A: PWA (Progressive Web App)** - RECOMMENDED
- No app store gatekeepers
- Railgun SDK works in browsers (WASM support)
- 30s proof generation (vs 1-2 min on native mobile)
- Installable on home screen
- No nodejs-mobile hack needed
- Limitation: No push notifications on iOS (improving), limited secure storage

**Option B: Native app with sideload distribution**
- Android APK direct download (like Obtainium)
- iOS TestFlight (limited to 10K users)
- Full native performance
- Risk: Small audience, trust barrier

**Option C: Native app, solve app store compliance**
- Requires crypto wallet licensing compliance
- Google Play: New requirements since 2025
- Apple: Case-by-case review
- Possible but adds 2-3 months to timeline

**Decision: Start with PWA (Option A), add native later if needed.** This sidesteps the blocker that killed Railway Wallet and gives us faster proof generation (browser WASM vs mobile C++ workaround).

### Grant Strategy (Immediate Actions)

Apply this week:
1. **Aztec wallet RFP** - forum.aztec.network/t/request-for-grant-proposals-wallets/6136
2. **Aleo grants** - aleo.org/grants (up to $100K + $350K Google Cloud credits)
3. **Oasis ROSE Bloom** - oasis.net/grants-program-application (up to $50K)

Monitor:
- EF ESP Wishlist (esp.ethereum.foundation/applicants/wishlist) - currently empty
- Starknet grants (starknet.io/grants) - up to $1M Growth Grants

---

## What We Killed (From the Original Proposal)

| Original Feature | Why It's Dead |
|---|---|
| FHE/MPC on-chain compute | 20 TPS, $0.13/tx, no mobile SDKs. 12-18 months from consumer viability. |
| Tor/mixnet routing | 3x data overhead. Unaffordable on mobile data plans. Battery killer. |
| AI risk scanner | Scope creep. Privacy product that analyzes your transactions is ironic. |
| Nigeria-first market | No quantum awareness, budget phones can't handle PQC, mandatory TIN/NIN linking, $335K VASP capital requirement. |
| Merchant QR integration | PQC signatures (3,309 bytes) don't fit QR codes. Needs protocol redesign. |
| Gamified education | Nice-to-have. Not MVP. |
| Federated learning fraud detection | Wildly out of scope. |
| Custom stablecoins | Regulatory nightmare. Use existing USDC/USDT. |
| Solana as primary chain | Railgun on Solana is early-stage (low anonymity set). EVM-first, Solana in Phase 3 via Railgun or Umbra/Arcium. |
| $2/mo pricing for Nigeria | 27% of average user crypto spend. Wrong market, wrong price. |
| Paystack fiat integration | Paystack has no crypto integration. Nigerian payment rails hostile to crypto. |

---

## The Gap We Fill

```
Current agent payment stack:

  Agent (Claude, GPT, custom)
    |
  AgentKit / x402 SDK       <-- wallet + payment rails (production)
    |
  Public Blockchain          <-- everything visible
    |
  EVERYONE CAN SEE           <-- competitors, MEV bots, regulators, hackers

What Veil adds:

  Agent or Human
    |
  Veil SDK / Veil App        <-- privacy wrapper
    |
  Railgun ZK Privacy         <-- zero-knowledge shielding
    |
  Public Blockchain           <-- on-chain, but encrypted
    |
  ONLY SENDER/RECEIVER SEE   <-- with view keys for compliance
```

**No one else is building this.** BITE Protocol on SKALE is the closest (commerce-level privacy for agentic payments), but it's SKALE-only and early concept stage.

---

## Core Architecture

### Design Principles

1. **Non-custodial.** User/agent controls keys. We never touch funds. (Avoids money transmitter classification.)
2. **Privacy by default.** Transactions are shielded unless user opts for transparency. (Railgun model.)
3. **Compliance by design.** View keys enable selective disclosure. Not full anonymity - financial privacy with auditability.
4. **Agent-native.** SDK-first. The mobile app is a client of the same SDK agents use.
5. **PQC-ready.** Hybrid ECDSA + ML-DSA from day one via ERC-4337 smart wallet. Future-proof without forcing migration.
6. **Chain-agnostic but opinionated.** Start with Ethereum + Polygon + Arbitrum (where Railgun has liquidity). Expand later.

### System Architecture

```
+------------------+     +------------------+
|  Veil PWA        |     |  Veil Agent SDK  |
|  (Next.js)       |     |  (TypeScript/Py) |
+--------+---------+     +--------+---------+
         |                         |
         +----------+--------------+
                    |
         +----------v-----------+
         |    Veil Core SDK     |
         |    (TypeScript)      |
         |                      |
         | - Wallet management  |
         | - Privacy operations |
         | - Key management     |
         | - View key system    |
         +-----------+----------+
                     |
        +------------+------------+
        |                         |
+-------v--------+    +----------v---------+
| Railgun Engine |    | Smart Wallet       |
| (ZK Proofs)    |    | (ERC-4337)         |
|                |    |                    |
| - Shield       |    | - Hybrid sig       |
| - Unshield     |    |   (ECDSA + ML-DSA) |
| - Private xfer |    | - Social recovery  |
| - Private swap |    | - Session keys     |
+-------+--------+    | - Spending limits  |
        |              +----------+---------+
        |                         |
        +------------+------------+
                     |
         +-----------v-----------+
         |    Blockchain Layer   |
         |                      |
         | Ethereum | Polygon   |
         | Arbitrum | Base*     |
         | Solana** |           |
         +-----------------------+

*  Base added Phase 2 for x402 agent compatibility
** Solana added Phase 3 for Jupiter integration (Railgun or Umbra/Arcium)
```

### Key Technical Decisions

**Why Railgun (not Aztec, not custom ZK):**
- Production-ready NOW ($83-106M TVL, $4.5B cumulative volume)
- Multi-chain (ETH, Polygon, Arbitrum, BSC)
- Supports any ERC-20 (USDC, USDT, WETH, etc.)
- Private swaps via DEX integration (Uniswap, etc.)
- View keys for compliance built in
- Open source (Railway Wallet is the reference implementation)
- Aztec is promising but transactions only went live early 2026, ecosystem is thin

**Why ERC-4337 Smart Wallet (not EOA):**
- Custom signature validation = PQC without protocol changes
- Social recovery (no seed phrase UX disaster)
- Session keys (agents get limited-permission keys)
- Spending limits (agent guardrails)
- Paymaster support (gasless transactions on Base/Polygon)
- Ethereum Foundation is building PQC migration around AA

**Why Hybrid ECDSA + ML-DSA (not pure PQC):**
- ECDSA works today, ML-DSA future-proofs
- Smart wallet validates either signature
- Users can migrate at their own pace
- Gas cost: ML-DSA verification is expensive on-chain (~100K+ gas vs 3K for ECDSA), but getting cheaper. Use ECDSA for daily ops, ML-DSA for high-value.
- poqeth library (MIT license) has optimized EVM PQC verification
- EIP-8051 (ML-DSA precompile) will reduce costs when adopted

**Why PWA / Next.js (not React Native):**
- Railway Wallet (RN) was rejected by app stores - we'd face the same problem
- Railgun SDK uses WASM which works natively in browsers but requires nodejs-mobile hack in RN
- ZK proof generation is 2-4x FASTER in browser WASM than mobile native C++ workaround
- No app store gatekeepers - ship direct to users
- Same codebase serves desktop + mobile

---

## Feature Scope

### Phase 1: MVP (Human Privacy Wallet) - 12 weeks

**Goal:** Ship a PWA wallet that does private USDC/USDT transfers better than anything else.

**Core features:**
1. **ERC-4337 smart wallet creation** (no seed phrase - social recovery)
2. **Shield assets** (deposit USDC/USDT/ETH/WETH into Railgun privacy pool)
3. **Private transfers** (send shielded tokens to any Railgun-compatible address)
4. **Unshield assets** (withdraw to any Ethereum address)
5. **View keys** (generate read-only keys for auditors/tax/compliance)
6. **Multi-chain** (Ethereum + Polygon + Arbitrum)
7. **Fiat on-ramp** (MoonPay or Transak integration - affiliate revenue)
8. **In-app swaps** (DEX aggregator with 0.85% fee - via Railgun for private swaps)

**What we DON'T build in Phase 1:**
- PQC signatures (not needed for MVP, adds complexity)
- Agent SDK (humans first)
- Custom smart contracts (use existing Railgun + standard ERC-4337)
- Token

**Tech deliverables:**
- Next.js PWA (installable on desktop + mobile)
- Veil Core SDK (TypeScript, published to npm)
- ERC-4337 wallet factory contract (deploy on ETH/Polygon/Arbitrum)
- Railgun integration module
- Fiat on-ramp integration
- DEX aggregator integration (0x or 1inch)

### Phase 2: Agent SDK + PQC (8 weeks after MVP)

**Goal:** Let any AI agent make private transactions with one SDK import.

**Core features:**
1. **Veil Agent SDK** (TypeScript + Python)
   - `npm install @veil/agent-sdk`
   - `pip install veil-agent-sdk`
   - Compatible with AgentKit, LangChain, CrewAI, AutoGPT
2. **Programmatic wallet creation** (agent gets a smart wallet in one API call)
3. **Private payment flow** (shield -> transfer -> unshield, automated)
4. **x402-compatible private payments** (intercept 402 responses, pay privately)
5. **Session keys for agents** (limited permissions, auto-expiring)
6. **Spending limits** (configurable caps per agent/session)
7. **Hybrid PQC signatures** (ECDSA + ML-DSA via poqeth)
8. **PQC key rotation** (migrate wallet from ECDSA to hybrid PQC)

**Agent integration example:**
```typescript
import { VeilAgent } from '@veil/agent-sdk';

const agent = await VeilAgent.create({
  chain: 'polygon',
  privacy: 'default', // all transactions shielded
  spendingLimit: '100 USDC/day',
  sessionExpiry: '24h',
  pqc: true, // enable hybrid ECDSA + ML-DSA
});

// Private payment (shielded on-chain)
await agent.pay({
  to: '0x...recipient',
  amount: '5.00',
  token: 'USDC',
}); // Zero-knowledge proof generated, tx submitted via relayer

// x402-compatible: agent pays for API access privately
const response = await agent.fetch('https://api.example.com/data', {
  payWith: 'USDC',
  maxAmount: '0.01',
});
```

**What this enables:**
- Enterprise agents transact without leaking strategy/spend to competitors
- Agent-to-agent payments that don't create public surveillance feeds
- Compliance via view keys (enterprise admin can audit agent spend)
- PQC protection for long-lived agent wallets (agents may run for years)

### Phase 3: Enterprise + Guardian Agents (12 weeks after Phase 2)

**Core features:**
1. **Enterprise dashboard** (web app for managing fleet of agent wallets)
2. **Guardian agent integration** (monitoring agent that audits other agents' private transactions via view keys)
3. **Batch privacy operations** (shield/unshield hundreds of transactions efficiently)
4. **Private multi-sig** (DAO treasuries with shielded operations)
5. **Cross-chain private bridging** (when Railgun or Aztec supports it)
6. **Base chain support** (for x402 ecosystem compatibility)
7. **Hardware wallet integration** (Trezor Safe 7 PQC-ready support)

---

## Tech Stack (Specific)

### Web App / PWA (Phase 1) - UPDATED POST-INVESTIGATION
| Component | Technology | Why |
|---|---|---|
| Framework | Next.js 15 or SvelteKit | PWA-first, SSR for landing page, CSR for wallet |
| State | Zustand | Lightweight, no boilerplate |
| Crypto | viem + wagmi | Modern, typed, tree-shakeable |
| Privacy | @railgun-community/wallet + engine | Production ZK privacy (WASM works in browser) |
| ZK Proofs | Browser WASM (native in all modern browsers) | 30s proof gen vs 1-2 min on mobile native |
| Wallet | ZeroDev or Alchemy Account Kit | ERC-4337 smart wallet |
| Fiat | MoonPay SDK | Highest affiliate revenue (0.5-1.25%) |
| Swaps | 0x API or 1inch Fusion | Best execution + affiliate fees |
| Storage | IndexedDB + Web Crypto API | Encrypted local storage, no native deps |
| PWA | next-pwa or vite-plugin-pwa | Installable, offline-capable |

**Why PWA over React Native:**
1. Railway Wallet (RN) was rejected by app stores - we'd face the same problem
2. Railgun SDK uses WASM which works natively in browsers but requires nodejs-mobile hack in RN
3. ZK proof generation is 2-4x FASTER in browser WASM than mobile native C++ workaround
4. No app store gatekeepers - ship direct to users
5. Same codebase serves desktop + mobile
6. Agent SDK shares same TypeScript core

### Core SDK (Phase 1-2)
| Component | Technology | Why |
|---|---|---|
| Language | TypeScript | Shared with mobile + agent SDK |
| PQC | @noble/post-quantum | JS PQC, works in Node + RN |
| EVM | viem | Modern, typed, tree-shakeable |
| Smart Wallet | poqeth (PQC validators) | MIT license, EVM PQC verification |
| Wallet Standard | ERC-4337 (Alchemy Account Kit or ZeroDev) | Best AA infrastructure |
| Relayer | Railgun relayer network | Submit txns without revealing address |
| Testing | Vitest | Fast, TypeScript-native |

### Agent SDK (Phase 2)
| Component | Technology | Why |
|---|---|---|
| TypeScript SDK | @veil/agent-sdk (npm) | Primary SDK |
| Python SDK | veil-agent-sdk (PyPI) | Python agents (LangChain, etc.) |
| AgentKit compat | Coinbase AgentKit plugin | Drop-in privacy for existing agents |
| x402 compat | x402 middleware | Intercept 402, pay privately |
| Session keys | ERC-4337 session key module | Agent permission scoping |

### Smart Contracts
| Contract | Purpose | Chain |
|---|---|---|
| VeilWalletFactory | Deploy ERC-4337 wallets | ETH, Polygon, Arbitrum |
| HybridSigValidator | ECDSA + ML-DSA signature validation | ETH, Polygon, Arbitrum |
| SessionKeyManager | Agent session key permissions | ETH, Polygon, Arbitrum |
| ViewKeyRegistry | On-chain view key management | ETH, Polygon, Arbitrum |

### Infrastructure - UPDATED POST-INVESTIGATION
| Component | Technology | Why |
|---|---|---|
| Backend | Minimal (landing page SSR only, wallet is client-side) | No server = no liability |
| Relayers | Railgun public broadcaster network + our own broadcaster | Redundancy + fee revenue |
| Our Broadcaster | ppoi-safe-broadcaster-example (Docker) | 1GB RAM, 20GB storage, easy to run |
| RPC | Alchemy or Infura | Standard, reliable |
| CI/CD | GitHub Actions | Standard |
| Monitoring | Sentry (web), Datadog (SDK) | Error tracking |
| Hosting | Vercel (PWA) or IPFS (censorship-resistant) | Fast deploys, edge CDN |

---

## User Personas (Real, Research-Backed)

### Primary (Phase 1 - Humans)

**1. The Whale Under Siege**
- Has >$100K on-chain, fears wrench attacks (50+ in 2025)
- Currently juggles Monero + fresh wallets + paranoid opsec
- Wants: address unlinking, private DeFi, no doxxing
- Will pay: High (survival motivation)
- Size: Hundreds of thousands globally

**2. The MEV Refugee**
- Lost money to sandwich attacks ($1.8B drained since 2020)
- Currently uses Flashbots Protect RPC (80% of ETH txns)
- Wants: private swaps, front-running protection
- Will pay: Low (expects it free/built-in)
- Size: Millions of DeFi users

**3. The Institutional Allocator**
- 76% plan to expand crypto, only 32% use privacy tools
- Needs compliance + confidentiality (view keys)
- Currently uses TEEs, considering ZK solutions
- Will pay: High (institutional budgets)
- Size: Thousands of funds/institutions

### Secondary (Phase 2 - Agents)

**4. The Enterprise Agent Fleet**
- Company deploys hundreds of agents making procurement/trading decisions
- All transactions currently public on Base/Ethereum
- Competitors can reverse-engineer strategy from on-chain data
- Needs: private agent payments, spending limits, audit trails
- Will pay: Enterprise pricing
- Size: 50% of enterprises deploying agents by 2027

**5. The Autonomous Trading Agent**
- AI agent executing DeFi strategies
- MEV bots front-run every visible transaction
- Needs: private swaps, private position management
- Will pay: Via swap fees (agent generates volume)
- Size: Growing exponentially

---

## Monetization Model

### Revenue Streams (Ranked by Viability)

| Stream | Fee | Expected Revenue | Phase |
|---|---|---|---|
| **Swap fees** | 0.85% per swap | $2-10M/yr at scale (benchmark: Phantom $220M, Rainbow $2M) | 1 |
| **Fiat on-ramp affiliate** | 0.5-1.25% per buy | $50-500K/yr depending on volume | 1 |
| **Enterprise agent SDK** | $99-999/mo per org | $100K-1M/yr with 100-1000 orgs | 2 |
| **Premium features** | $9.99/mo | $100K-500K/yr with 1-5K subscribers | 2 |
| **Relayer fees** | Small per-tx fee | Requires running relayers, low margin | 3 |

### What We Don't Do
- No native token (regulatory risk, governance overhead, Zcash drama)
- No mixing/tumbling service (Tornado Cash/Samourai legal precedent)
- No custodial anything (money transmitter classification)

### Grant Funding (Bootstrap)
- **Ethereum Foundation Privacy Cluster** ($2M+ allocated, 47 experts, actively funding)
- **Railgun ecosystem** (3+ wallets funded, growing)
- **Zcash Community Grants** (~$11M treasury)
- **EF PQC research grants** ($1M prize + $1M research grants announced Jan 2026)
- Target: $50-100K in grants to fund Phase 1

### Unit Economics
- Privacy transaction cost to user: Railgun shield/unshield gas + 0.25% Railgun protocol fee
- Our margin: 0.85% swap fee is pure margin (aggregator handles execution)
- Fiat affiliate: 0.5-1.25% on every buy (passive)
- Break-even: ~$500K monthly swap volume at 0.85% = ~$4,250/mo revenue

---

## Legal Architecture

### How We Stay Legal

**Structure: Non-custodial open-source software.**

| Risk | Mitigation |
|---|---|
| Money transmitter classification | Non-custodial. Users control keys. We never touch funds. Same legal posture as MetaMask. |
| Tornado Cash precedent | We don't operate a mixer. We integrate Railgun (existing protocol). We provide compliance tools (view keys). We don't market for illicit use. |
| Samourai precedent | We don't "alter transaction structure" ourselves - Railgun does. We're a wallet, not a mixing service. Key distinction from Samourai ruling. |
| Privacy coin regulations | We don't create a privacy coin. We shield existing tokens (USDC, ETH). Selective disclosure via view keys. |
| EU MiCA (July 2026) | View keys enable Travel Rule compliance. Non-custodial wallets have lighter requirements. |
| Fiat ramp licensing | We don't touch fiat. We embed licensed providers (MoonPay/Transak). They handle KYC/AML. |

**Marketing rules:**
- Say "financial privacy" never "anonymity"
- Say "selective disclosure" never "untraceable"
- Emphasize compliance features in all materials
- Never reference illicit use cases
- Include "compliance" in landing page above the fold

**Legal review needed before launch:**
- US money transmission analysis (state-by-state)
- EU MiCA compliance assessment
- Terms of service + privacy policy
- Open source license selection (MIT or Apache 2.0)

### Incorporation
- **US LLC (Delaware or Wyoming)** for simplicity
- Wyoming has crypto-friendly laws, no state income tax
- Consider Cayman/BVI subsidiary later for token if ever needed

---

## Competitive Positioning

### Direct Competitors

| Product | What They Do | Our Advantage |
|---|---|---|
| **Railway Wallet** | Railgun mobile wallet | We add: smart wallet (no seed phrase), PQC, agent SDK, fiat ramp, swap aggregator |
| **Railgun Web** | Railgun web interface | We add: mobile-first, agent SDK, PQC, better UX |
| **Aztec Wallets** | Privacy on Aztec L2 | We're multi-chain (ETH/Polygon/Arb). Aztec is single-chain, early stage. |
| **QSafe Wallet** | PQC wallet | They lack privacy transactions. PQC keys but transparent blockchain. |
| **ZenGo** | MPC wallet | No transaction privacy. Good UX benchmark. |
| **BITE Protocol** | Agent payment privacy on SKALE | SKALE-only, concept stage, no production deployment |

### Positioning Statement

**For humans:** "The wallet that keeps your financial life private. One-tap private transfers with built-in compliance."

**For agents:** "Private payment infrastructure for AI agents. Drop-in SDK for AgentKit, x402, and any agent framework."

**For enterprises:** "Agent fleet management with confidential transactions and auditable privacy."

### Why Now (Timing)
1. Railgun is production-ready ($100M+ TVL) - we don't need to build privacy from scratch
2. ERC-4337 is mature - smart wallets are standard now
3. Agent economy is exploding (50M+ x402 txns, AgentKit live) but NO privacy
4. Ethereum Foundation just prioritized PQC ($2M funding, dedicated team)
5. Privacy narrative flipped ("pragmatic privacy" is mainstream in 2026)
6. 12-18 month window before Ethereum/Solana ship native PQC (our head start)

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Railgun gets sanctioned/shut down** | Low (Tornado sanctions lifted, Railgun praised by Vitalik) | Critical | Architecture allows swapping privacy backend. Aztec as fallback. |
| **Regulatory crackdown on privacy wallets** | Medium | High | View keys + compliance features. Non-custodial posture. No mixer functionality. Legal review before launch. |
| **Railgun SDK browser WASM issues** | Low | High | Railgun SDK designed for browser WASM. Railway Wallet web version proves it works. |
| **PQC signature gas costs too high** | High (current: 100K+ gas) | Medium | Phase 2 feature, not MVP. Use ECDSA for daily ops. Wait for EIP-8051 precompile. L2 deployment reduces costs. |
| **Agent economy slower than projected** | Medium | Medium | Human wallet stands alone as viable product. Agent SDK is upside. |
| **Competitor builds this first** | Low (no one is building this specifically) | High | Speed. Ship MVP in 12 weeks. First-mover in privacy + agents. |
| **Low swap volume (revenue risk)** | Medium | Medium | Multiple revenue streams. Grant funding for runway. Keep costs low (2-3 person team). |
| **Privacy set too small** | Medium (Railgun TVL growing but still $100M) | High | Railgun privacy set grows with all Railgun users, not just ours. Multi-chain helps. |

---

## Phased Roadmap

### Phase 1: MVP Human Wallet (Weeks 1-12)

**Weeks 1-3: Foundation**
- Set up monorepo (Turborepo + pnpm: PWA + core SDK + contracts)
- Deploy ERC-4337 wallet factory on Polygon testnet
- Integrate Railgun SDK (reference: Railway Wallet source)
- Basic wallet creation flow (social recovery, no seed phrase)

**Weeks 4-7: Core Privacy**
- Shield/unshield flow (USDC, USDT, WETH, ETH)
- Private transfer (shielded address to shielded address)
- View key generation and export
- Multi-chain support (Ethereum mainnet + Polygon + Arbitrum)
- Relayer integration (submit txns without revealing address)

**Weeks 8-10: Monetization + Polish**
- MoonPay/Transak fiat on-ramp integration
- DEX aggregator (0x or 1inch) with 0.85% fee
- Private swap flow (swap within Railgun shield)
- Transaction history (private, client-side only)
- Settings, security, backup flow

**Weeks 11-12: Launch**
- Browser compatibility testing (Chrome, Firefox, Safari, mobile browsers)
- Security review (focus on key management, not full audit yet)
- Landing page + docs
- Deploy own Railgun broadcaster (Docker VPS)
- Soft launch to crypto privacy communities (r/privacy, Railgun Discord, Zcash community)

**Deliverables:**
- PWA deployed to Vercel (installable on desktop + mobile)
- @veil/core SDK on npm
- Smart wallet contracts on mainnet (ETH/Polygon/Arbitrum)
- Landing page
- Own Railgun broadcaster running

### Phase 2: Agent SDK + PQC (Weeks 13-20)

**Weeks 13-15: Agent SDK**
- TypeScript SDK (@veil/agent-sdk)
- Python wrapper (veil-agent-sdk)
- Programmatic wallet creation
- Session key management
- Spending limit enforcement

**Weeks 16-18: Agent Integrations**
- AgentKit plugin (drop-in privacy for Coinbase agents)
- x402 middleware (intercept 402, pay privately)
- LangChain/CrewAI tool integration
- Documentation + examples

**Weeks 19-20: PQC Integration**
- Deploy HybridSigValidator contract (poqeth ML-DSA)
- @noble/post-quantum integration in core SDK
- PQC key generation + rotation flow
- Hybrid signature mode (ECDSA default, ML-DSA opt-in)

**Deliverables:**
- Agent SDK (npm + PyPI)
- AgentKit plugin
- x402 privacy middleware
- PQC-enabled smart wallet contracts
- Developer docs

### Phase 3: Enterprise + Solana/Jupiter + Scale (Weeks 21-32)

- Enterprise dashboard (web app)
- Agent fleet management
- Guardian agent integration
- Private multi-sig (DAO treasuries)
- Hardware wallet support (Trezor Safe 7)
- Base chain support (x402 ecosystem)
- **Solana chain support (Railgun Solana or Umbra/Arcium)**
- **Jupiter Ultra API integration for private swaps on Solana**
- **Jupnet cross-chain private swaps (when live)**
- Formal security audit
- Enterprise sales

---

## Resource Requirements

### Team (Minimum Viable)

**Phase 1 (3 people):**
1. **Full-stack / Web lead** - Next.js, viem/wagmi, wallet UX
2. **Smart contract / ZK engineer** - ERC-4337, Railgun integration, Solidity
3. **You** - Product, design, business, community

**Phase 2 add (1-2 people):**
4. **SDK engineer** - TypeScript/Python SDK, agent framework integrations
5. **DevRel** (part-time) - Docs, examples, community

### Budget (12 months)

| Item | Cost |
|---|---|
| Engineering (2 contractors, 12mo) | $120-200K |
| Security audit (Phase 3) | $30-50K |
| Legal review | $10-20K |
| Infrastructure (RPC, monitoring) | $5-10K |
| MoonPay/Transak integration fees | $0 (free for wallet integrators) |
| App Store fees | $100/yr (Apple) + $25 (Google) |
| **Total** | **$165-280K** |

### Funding Strategy
1. Apply for EF Privacy Cluster grant ($50-100K target)
2. Apply for Railgun ecosystem grant
3. Apply for EF PQC research grant ($50-100K target)
4. Bootstrap remaining from personal funds or small angel round
5. Revenue from swap fees starts Phase 1 launch

---

## Open Questions (Remaining)

### Technical (answered questions moved to Investigation Results above)
1. **PWA secure key storage** - Web Crypto API + IndexedDB sufficient? Need to prototype and test.
2. **Railgun SDK browser integration** - Docs look good for web, need to validate WASM init + proof gen in Web Worker.
3. **Railgun V3 timeline** - Delayed from 2024, still unreleased. Don't depend on it for MVP.
4. **ethers.js vs viem conflict** - Railgun SDK uses ethers v5. Our stack uses viem. Need to handle dual dependency.
5. **Railgun Solana maturity** - RAILSOL exists but deployment stage unclear. Anonymity set size unknown. Evaluate for Phase 3.

### Business
1. **Railway Wallet team** - Potential collaboration or competition? Worth reaching out.
2. **Enterprise pricing** - What would a company pay for private agent transactions? Need customer discovery.
3. **Jupiter integration partnership** - Worth reaching out to Jupiter team re: privacy layer integration.

### Legal
1. **US money transmission analysis** - Confirm non-custodial smart wallet is not a money transmitter in all 50 states.
2. **View key compliance** - Do regulators actually accept view keys as Travel Rule compliance? Need legal opinion.
3. **Open source liability** - MIT vs Apache 2.0 for the SDK? Patent protection considerations.

---

## Success Metrics

### Phase 1 (Month 3)
- 500+ wallet creations
- $100K+ total shielded volume
- 50+ daily active users
- Swap revenue covering infrastructure costs

### Phase 2 (Month 5)
- 10+ agent integrations using SDK
- 1,000+ total wallets
- $1M+ monthly shielded volume
- 1 enterprise pilot

### Phase 3 (Month 8)
- 5,000+ total wallets
- $5M+ monthly shielded volume
- 5+ enterprise customers
- Solana/Jupiter private swaps live
- Break-even on operating costs

---

## What Makes This Win

1. **Timing:** Agent economy is exploding but has zero privacy. We're early.
2. **Leverage:** We don't build privacy from scratch. Railgun does the hard crypto. We build UX + agent integration.
3. **Dual market:** Human wallet generates revenue now. Agent SDK captures the exponential growth.
4. **PQC moat:** First wallet with production PQC signatures. 12-18 month head start before native chain support.
5. **Non-custodial:** No regulatory license needed. No funds liability. Ship fast.
6. **Open source:** Required for grants, builds trust, attracts contributors.

The product is a privacy layer, not a privacy chain. We don't need liquidity bootstrapping, validator sets, or token launches. We plug into existing infrastructure and make it private.
