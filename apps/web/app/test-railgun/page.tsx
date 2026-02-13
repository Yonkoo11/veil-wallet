"use client";

import { useState } from "react";

type LogEntry = { time: string; msg: string; type: "info" | "error" | "success" };

export default function TestRailgun() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);

  const log = (msg: string, type: LogEntry["type"] = "info") => {
    const time = new Date().toISOString().split("T")[1].slice(0, 12);
    setLogs((prev) => [...prev, { time, msg, type }]);
  };

  const runTest = async () => {
    setRunning(true);
    setLogs([]);

    try {
      // Step 1: Import the SDK
      log("Importing @railgun-community/wallet...");
      const startImport = performance.now();
      const wallet = await import("@railgun-community/wallet");
      const importTime = (performance.now() - startImport).toFixed(0);
      log(`SDK imported in ${importTime}ms`, "success");
      log(`Available exports: ${Object.keys(wallet).slice(0, 15).join(", ")}...`);

      // Step 2: Check for engine initialization function
      if (typeof wallet.startRailgunEngine === "function") {
        log("startRailgunEngine found", "success");
      } else {
        log("startRailgunEngine NOT found - checking alternative APIs...", "error");
        const engineFns = Object.keys(wallet).filter((k) =>
          k.toLowerCase().includes("engine") || k.toLowerCase().includes("init"),
        );
        log(`Engine-related exports: ${engineFns.join(", ") || "none"}`);
      }

      // Step 3: Dump all function exports by category
      const allExports = Object.keys(wallet).sort();
      const shield = allExports.filter(k => k.toLowerCase().includes('shield'));
      const balance = allExports.filter(k => k.toLowerCase().includes('balance'));
      const proof = allExports.filter(k => k.toLowerCase().includes('proof') || k.toLowerCase().includes('generate'));
      const wallet_fns = allExports.filter(k => k.toLowerCase().includes('wallet'));

      log(`Shield-related: ${shield.join(", ") || "none"}`);
      log(`Balance-related: ${balance.join(", ") || "none"}`);
      log(`Proof/Generate-related: ${proof.join(", ") || "none"}`);
      log(`Wallet-related: ${wallet_fns.join(", ") || "none"}`);
      log(`Total exports: ${allExports.length}`);

      // Step 4: Try to create an artifact store (IndexedDB)
      log("Testing IndexedDB artifact store...");
      const dbName = "railgun-test-artifacts";
      const request = indexedDB.open(dbName, 1);
      await new Promise<void>((resolve, reject) => {
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          request.result.close();
          indexedDB.deleteDatabase(dbName);
          resolve();
        };
        request.onupgradeneeded = () => {
          request.result.createObjectStore("artifacts");
        };
      });
      log("IndexedDB works", "success");

      // Step 5: Test Web Crypto (needed for key derivation)
      log("Testing Web Crypto API...");
      const testKey = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"],
      );
      log(`Web Crypto works (generated ${testKey.algorithm.name} key)`, "success");

      // Step 6: Try engine init with correct v10 params
      log("Attempting engine initialization...");
      try {
        // Create LevelDB over IndexedDB
        log("  Creating LevelDB (level-js)...");
        // @ts-expect-error level-js has no type declarations
        const LevelDB = (await import("level-js")).default;
        const db = new LevelDB("veil-test-db");
        log("  LevelDB created", "success");

        // Create artifact store with localforage
        log("  Creating artifact store (localforage)...");
        const localforage = (await import("localforage")).default;
        const store = localforage.createInstance({ name: "railgun-test-artifacts" });
        const artifactStore = {
          get: async (path: string) => store.getItem<string | null>(path),
          store: async (_dir: string, path: string, item: string | ArrayBuffer) => { await store.setItem(path, item); },
          exists: async (path: string) => (await store.getItem(path)) != null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
        log("  Artifact store created", "success");

        const startEngine = performance.now();
        await wallet.startRailgunEngine(
          "veiltest",           // walletSource (max 16, lowercase alphanumeric)
          db,                   // LevelDB instance
          true,                 // shouldDebug (true for testing)
          artifactStore,
          false,                // useNativeArtifacts (false = WASM)
          true,                 // skipMerkletreeScans (no RPC to scan)
          [],                   // poiNodeURLs (skip for test)
          [],                   // customPOILists
          false,                // verboseScanLogging
        );
        const engineTime = (performance.now() - startEngine).toFixed(0);
        log(`Engine initialized in ${engineTime}ms!`, "success");
      } catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        if (err.includes("WASM") || err.includes("wasm")) {
          log(`WASM loading failed: ${err}`, "error");
        } else {
          log(`Engine init error: ${err.slice(0, 300)}`, "error");
        }
      }

      log("--- Test complete ---", "success");
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      log(`Fatal error: ${err}`, "error");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-dvh bg-neutral-950 text-neutral-100 p-6 font-mono text-sm">
      <h1 className="text-lg font-bold mb-4">Railgun SDK Browser Test</h1>

      <button
        onClick={runTest}
        disabled={running}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg mb-6"
      >
        {running ? "Running..." : "Run Integration Test"}
      </button>

      <div className="space-y-1">
        {logs.map((entry, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-neutral-600 shrink-0">{entry.time}</span>
            <span
              className={
                entry.type === "error"
                  ? "text-red-400"
                  : entry.type === "success"
                    ? "text-green-400"
                    : "text-neutral-400"
              }
            >
              {entry.msg}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
