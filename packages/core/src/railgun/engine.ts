/**
 * Railgun SDK engine initialization and management.
 *
 * The Railgun engine handles:
 * - WASM prover loading (for ZK proof generation)
 * - Chain provider management
 * - Merkle tree state (UTXO tracking)
 * - Artifact storage (proving keys, ~50MB on first download)
 *
 * Browser dependencies:
 * - level-js: LevelDB over IndexedDB
 * - localforage: Persistent artifact cache
 */

export interface RailgunConfig {
  polygonRpcUrl: string;
  arbitrumRpcUrl: string;
  ethereumRpcUrl?: string;
  pollingIntervalMs?: number;
  poiNodeUrls?: string[];
  shouldDebug?: boolean;
}

let engineInitialized = false;

/**
 * Create an artifact store compatible with Railgun SDK.
 * Uses localforage (IndexedDB) for persistent storage.
 */
export async function createArtifactStore() {
  const localforage = (await import('localforage')).default;

  const store = localforage.createInstance({
    name: 'railgun-artifacts',
  });

  return {
    get: async (path: string) => {
      return store.getItem(path);
    },
    store: async (_dir: string, path: string, item: string | ArrayBuffer) => {
      await store.setItem(path, item);
    },
    exists: async (path: string) => {
      return (await store.getItem(path)) != null;
    },
  };
}

/**
 * Create a LevelDB database backed by IndexedDB (browser).
 */
async function createDatabase(dbPath: string) {
  const LevelDB = (await import('level-js')).default;
  return new LevelDB(dbPath);
}

/**
 * Initialize the Railgun engine.
 *
 * Must be called once before any privacy operations.
 * Loads WASM prover and sets up chain providers.
 */
export async function initEngine(config: RailgunConfig): Promise<void> {
  if (engineInitialized) return;

  const { startRailgunEngine, loadProvider } = await import(
    '@railgun-community/wallet'
  );

  const db = await createDatabase('veil-engine-db');
  const artifactStore = await createArtifactStore();

  await startRailgunEngine(
    'veilwallet',           // walletSource (max 16 chars, lowercase alphanumeric)
    db,                     // LevelDB-compatible database
    config.shouldDebug ?? false,
    artifactStore,          // Persistent artifact store
    false,                  // useNativeArtifacts (false = WASM for browser)
    false,                  // skipMerkletreeScans
    config.poiNodeUrls ?? ['https://poi-aggregator.railgun.org'],
    [],                     // customPOILists
    false,                  // verboseScanLogging
  );

  const pollingInterval = config.pollingIntervalMs ?? 300_000; // 5 min default

  // Load Polygon provider
  await loadProvider(
    {
      chainId: 137,
      providers: [
        { provider: config.polygonRpcUrl, priority: 1, weight: 1 },
      ],
    },
    'Polygon',
    pollingInterval,
  );

  // Load Arbitrum provider
  await loadProvider(
    {
      chainId: 42161,
      providers: [
        { provider: config.arbitrumRpcUrl, priority: 1, weight: 1 },
      ],
    },
    'Arbitrum',
    pollingInterval,
  );

  // Load Ethereum provider (optional)
  if (config.ethereumRpcUrl) {
    await loadProvider(
      {
        chainId: 1,
        providers: [
          { provider: config.ethereumRpcUrl, priority: 1, weight: 1 },
        ],
      },
      'Ethereum',
      pollingInterval,
    );
  }

  engineInitialized = true;
}

export function isEngineInitialized(): boolean {
  return engineInitialized;
}
