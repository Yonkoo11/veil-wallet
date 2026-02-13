# Veil - Progress

## Current State (Feb 13, 2026)

### Completed - Foundation
- All research and documentation (PRD, TECHNICAL_MVP, plan.md, memory.md)
- **Monorepo initialized**: Turborepo + pnpm, `apps/web` + `packages/core`
- **Core package (`@veil/core`)**: Builds clean (CJS + ESM + DTS)
  - Key derivation: PBKDF2 + HKDF (derive.ts)
  - AES-256-GCM encryption (encrypt.ts)
  - Encrypted IndexedDB storage via idb-keyval (storage.ts)
  - View key generation (viewkeys.ts)
  - Railgun SDK wrappers updated to v10.8.3 API names
  - Engine init: level-js (LevelDB over IndexedDB) + localforage (artifact cache)
  - Wallet creation + loading: Railgun wallet + EOA address derivation (create.ts)
  - `deriveRailgunEncryptionKey()` - hex-encoded key for Railgun internal storage
  - Transaction broadcasting (broadcast.ts) - direct RPC for v1, broadcaster for Phase 2
  - `CreateWalletResult` includes `railgunEncryptionKey` (no double PBKDF2)
- **Next.js PWA (`@veil/web`)**: Builds clean (dev + prod), all routes work
  - Next.js 16 + React 19 + Tailwind 4 + Zustand 5
  - WASM support in webpack config
  - Mobile-first (390px viewport tested)
- **Railgun SDK v10.8.3 browser integration VERIFIED:**
  - SDK loads in browser (182 exports, 4-7s import)
  - WASM modules load (curve25519 + poseidon hash)
  - **Engine initializes in 170ms** (LevelDB + localforage + WASM)

### Completed - Wallet Pipeline
- Password auth -> PBKDF2 key derivation -> Railgun wallet + EOA
- Engine init hook (use-railgun-engine.ts)
- Zustand store with engineStatus, walletId, railgunEncryptionKey, pendingAuthSecret
- creating.tsx uses real createWallet() from @veil/core
- onboarding.tsx has password input (min 8 chars)
- **Session persistence**: checkWalletExists() + loadWallet() for returning users
- **Login screen**: password re-entry to unlock existing wallet
- **walletId persisted** in IndexedDB (public storage, needed for SDK operations)
- .env.local with public RPC URLs

### Completed - Transaction Flows (End-to-End)
- Token list with Polygon mainnet tokens (lib/tokens.ts): POL, USDC, USDT, WETH, DAI, WPOL
- Balance fetching hook (use-balances.ts): viem public client, polls every 30s
- **Private balance fetching**: wired to real getPrivateBalances() from @veil/core
- Shared TxProgress component (generating -> submitting -> success/error with txHash)
- **Proof worker rewritten**: uses @veil/core wrappers instead of raw SDK calls
- **Broadcasting hook (use-broadcast.ts)**: submits tx after proof generation
- Shield: form -> proof -> broadcast -> success (direct RPC)
- Send: form -> proof -> broadcast -> success (private via broadcaster)
- Unshield: form -> proof -> broadcast -> success (private via broadcaster)
- Swap: form -> quote (real 0x API or mock) -> proof -> broadcast -> success
- Receive: public + private address display with copy
- Dashboard: 5 action buttons (Shield, Send, Receive, Swap, Unshield) all wired
- **All screens pass walletId from store to proof worker**

### Completed - Browser E2E Test (Feb 13)
- **Onboarding**: Password input, Create Wallet button renders correctly
- **Wallet creation**: Real EOA address (0xE8Fd...) + real 0zk address generated
- **Dashboard**: Shows address, balance cards, 5 action buttons all routed
- **Shield screen**: Token selector + amount + Shield button
- **Send screen**: 0zk recipient + token selector + amount
- **Receive screen**: Public address + 0zk private address both populated
- **Swap screen**: Sell/buy token selectors + Get Quote
- **Unshield screen**: Destination address + token + amount
- **Session persistence**: Page refresh detects wallet -> shows Login screen
- **Login (unlock)**: Password re-entry -> same wallet restored to dashboard

### Completed - Code Audit + Fixes (Feb 13)
Ran comprehensive 25-issue audit. Fixed all actionable items:

**CRITICAL fixes:**
- State updates during render in shield/send/swap/unshield -> wrapped in useEffect
- `railgunWallet.zkAddress` -> `railgunWallet.railgunAddress` (SDK property name)
- `ethers` package missing -> added to deps

**HIGH fixes:**
- Error boundary added (error-boundary.tsx wrapping page.tsx)
- Double PBKDF2 derivation eliminated (CreateWalletResult now includes railgunEncryptionKey)

**MEDIUM fixes:**
- Amount input allows "1.2.3" -> added second regex to strip extra dots
- All 4 tx screens patched consistently

**Remaining audit items (acceptable for MVP):**
- Password strength validation (only checks length >= 8)
- railgunEncKey in public IndexedDB (needed for engine init before unlock)
- No CSP headers (deploy-time config)
- Console.error in production (non-sensitive messages)

### Build Notes
- Next.js 16: build uses `--webpack`, dev uses Turbopack
- TS 5.9: `BufferSource` casts needed for Web Crypto
- @railgun-community/wallet in BOTH core and web for webpack resolution
- level-js and localforage in BOTH core and web
- BigInt literals: use `BigInt(0)` not `0n` (target below ES2020)
- viem + ethers in both core and web packages
- Production build: 2m57s, 0 errors, 3 static routes

### Completed - UI Revamp (Feb 13)
14-point audit fix applied across all 11 component files + globals.css:
- Focus-visible rings, 40px touch targets, 16px inputs (iOS), prefers-reduced-motion
- Border-radius consolidated (xl + full only), contrast upgraded (neutral-500 min)
- Tabular-nums on financial data, active states, aria-labels, honest "shielded" copy
- Automated audit: 0 violations

### Completed - GitHub Repo + Pages Deploy (Feb 13)
- Repo: https://github.com/Yonkoo11/veil-wallet
- Pages: https://yonkoo11.github.io/veil-wallet/
- Static export with basePath=/veil-wallet, SPA 404.html fallback
- GitHub Actions workflow on push to main

### Completed - Price Feeds (Feb 13)
- CoinGecko free API (no key needed), 1-min cache, 5s timeout
- lib/prices.ts: fetchPrices() + getUsdValue()
- Wired into use-balances.ts for both public and private balances
- Supports: POL, USDC, USDT, WETH, DAI, WPOL

### Completed - Visual Cohesion ("Feel Alive") (Feb 13)
CSS-only animation system, zero new dependencies:
- fadeInUp + scaleIn keyframes with cubic-bezier(0.22, 1, 0.36, 1) ease-out
- Staggered entrances: onboarding (5 sections), dashboard (4), receive (4)
- Screen-level fade-in on all tx screens (shield, send, swap, unshield)
- Global button press feedback: scale(0.97) on :active
- Privacy glow (glow-indigo): balance card + private address card
- Success/error icon scale-in pop on tx-progress
- Respects prefers-reduced-motion, animation-fill-mode: backwards (no transform conflicts)

### What Still Needs Work
1. **Broadcaster integration**: Currently all txs go direct to RPC. Need Waku P2P broadcaster for privacy.
2. **Import wallet flow**: "Import Wallet" button on onboarding is placeholder.
4. **Social recovery**: recovery.ts throws "not implemented".
5. **Service worker**: 50MB Railgun artifacts not cached offline.
6. **ZeroDev smart wallet**: Phase 2 (ERC-4337).
7. **Passkey PRF auth**: Phase 2.

### Chainlink Hackathon
- Privacy track or CRE & AI track - both fit
- Will build separate CRE-native project after Veil core is solid
- Deadline: March 1
