# Veil - AI Memory

## What Is This
Privacy transaction infrastructure for humans and AI agents. PWA wallet + SDK. Built on Railgun (ZK privacy) + ERC-4337 (smart wallets) + PQC (quantum resistance).

## Key Decisions Made
- **Hybrid approach**: Human wallet first, agent SDK second. Same core infrastructure.
- **Killed**: FHE, Tor/mixnet, Nigeria-first, AI scanner, custom stablecoins, gamification, merchant QR
- **Privacy engine**: Railgun (production-ready, $108M TVL, multi-chain including Solana)
- **Wallet standard**: ERC-4337 smart wallet (no seed phrase, PQC-ready, session keys for agents)
- **PQC**: Hybrid ECDSA + ML-DSA via poqeth library. Phase 2, not MVP.
- **Chains**: Ethereum + Polygon + Arbitrum (Phase 1). Base for x402 (Phase 2). Solana for Jupiter (Phase 3).
- **No token**: Revenue from swap fees (0.85%) + fiat affiliate + enterprise SDK licensing
- **Non-custodial**: Avoids money transmitter classification. Users control keys.
- **Compliance**: View keys + PPOI (Private Proofs of Innocence). "Financial privacy" not "anonymity."
- **PWA over React Native**: Railway Wallet (RN) discontinued mobile due to app store rejections. PWA avoids gatekeepers, has native WASM support (faster ZK proofs), same codebase for desktop+mobile.
- **Run our own broadcaster**: Railgun broadcaster is open source, easy to run (1GB RAM, Docker). Adds reliability + fee revenue.
- **Jupiter as Phase 3 swap target**: $3B+ TVL, $350M daily volume, 95% Solana DEX market. Ultra API is clean REST integration. No protocol-level privacy (only MEV protection via Beam). Clear gap for Veil.

## Research Completed (Feb 2026)
- PQC mobile readiness (liboqs, @noble/post-quantum, NIST standards finalized Aug 2024)
- FHE/MPC/ZK feasibility (Railgun best option, FHE not ready, MPC for keys only)
- Privacy wallet competitors (Railway, Zashi, Aztec, QSafe, Penumbra, Namada)
- Regulatory/legal landscape (Tornado Cash/Samourai precedents, view keys accepted)
- Nigeria market assessment (wrong market - killed)
- Account abstraction + PQC (poqeth, EIP-8051, EF PQC team $2M funding)
- Monetization models (swap fees 0.85%, MoonPay affiliate 0.5-1.25%, enterprise SDK)
- User personas (whales, MEV refugees, institutions, enterprise agent fleets)
- Agent wallet infrastructure (AgentKit, x402, Visa TAP - none have privacy)
- **Jupiter/Solana ecosystem** (Feb 2026 - see below)

## Investigation Results (Feb 2026)
- **Railway Wallet mobile DISCONTINUED** - app store policies killed it. Do NOT fork for mobile. Use PWA instead.
- **ERC-4337 + Railgun: CONFIRMED COMPATIBLE** - works with Gnosis Safe already. V3 adds native ERC-4337.
- **Railgun SDK uses WASM** - works in browsers natively, needs nodejs-mobile hack for RN (heavy, slow)
- **ZK proof gen**: 30s browser, 1-2 min mobile native
- **PQC gas costs**: ML-DSA $0.004 on Arbitrum (viable), $0.18 on L1 (too expensive). L2-first confirmed.
- **Relayer network**: Decentralized (Waku P2P), open source, easy to self-host. No SPOF.
- **Best grants**: Aztec wallet RFP, Aleo ($100K + Google Cloud), Oasis ($50K), Starknet ($1M)

## Jupiter / Solana Research (Feb 2026)
- **Jupiter**: $3B+ TVL, $350M daily volume, 95% Solana DEX share. Full DeFi superapp (swaps, perps, lending, JupUSD stablecoin, Polymarket). $35M ParaFi investment Feb 2026.
- **Jupiter Ultra API**: REST-based, gasless, sub-2s latency. `GET /ultra/v1/order` + `POST /ultra/v1/execute`. TypeScript/Rust SDKs. No payment required. Rate limits scale with volume.
- **Jupiter Beam**: Proprietary tx landing engine. Bypasses public mempool. MEV protection only -- NOT protocol-level privacy. Veil fills this gap.
- **Jupnet**: Omnichain liquidity network (cross-chain without bridges). Testnet Q4 2025. Could enable cross-chain private swaps.
- **Railgun on Solana**: RAILSOL governance token exists. Deployment confirmed but early-stage. Anonymity set likely thin.
- **Elusiv**: DEAD. Sunsetted Feb 2024. Not a target.
- **Light Protocol**: Pivoted to ZK Compression (scalability). No longer privacy.
- **Arcium**: MPC-based encrypted compute. Mainnet Alpha Q4 2025. Confidential SPL token standard (C-SPL) Q1 2026. Infrastructure layer.
- **Umbra**: First app on Arcium. Shielded transfers + encrypted swaps. Viewing keys for auditability. Mainnet Feb 2026. Closest Solana-native competitor to what Veil would do.
- **Solana Privacy Hack**: Jan 12-30, 2026, $100K+ prizes. Ecosystem actively courting privacy builders.
- **Phase 3 strategy**: Use Railgun on Solana if anonymity set is deep enough, otherwise Umbra/Arcium as Solana privacy backend. Jupiter Ultra API for swap routing.

## The Core Thesis
Agent payment infrastructure (AgentKit, x402) is live and scaling (50M+ txns). None of it has privacy. Every agent transaction is public. Veil adds ZK privacy as a layer. Humans get a PWA wallet. Agents get an SDK. Same privacy engine underneath. Phase 3 extends to Solana/Jupiter -- the biggest DEX has zero privacy.

## Documents
- **PRD**: `/Users/yonko/Projects/Veil/PRD.md` - Product requirements
- **Technical MVP**: `/Users/yonko/Projects/Veil/TECHNICAL_MVP.md` - Implementation spec
- **Plan**: `/Users/yonko/Projects/Veil/ai/plan.md` - Strategic plan with investigation results

## Doc Review Issues (to fix in TECHNICAL_MVP before building)
- Missing Web Worker for ZK proof gen (will block main thread)
- Missing service worker caching for 50MB Railgun artifacts
- ethers.js v5 (Railgun) vs viem (our stack) dual dependency
- 0x API v1 endpoint may be stale (check v2)
- CSP connect-src incomplete (missing ZeroDev, artifact CDN, MoonPay, Sentry)
- Shield flow conflates bundler vs broadcaster (different privacy trade-offs)
- Need to specify pnpm as package manager

## Remaining Open Questions
- PWA secure key storage (Web Crypto API + IndexedDB - sufficient? Need to test)
- Railgun SDK browser integration (docs good for web, need to prototype)
- Railgun V3 timeline (delayed from 2024, still unreleased - don't depend on it)
- ethers.js vs viem dual dependency handling
- Railgun Solana deployment maturity + anonymity set depth (for Phase 3)
