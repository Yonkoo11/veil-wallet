/**
 * Encrypted IndexedDB storage using idb-keyval.
 * All sensitive wallet data passes through AES-256-GCM encryption.
 */

import { get, set, del, keys, createStore } from 'idb-keyval';
import { encrypt, decrypt, encryptJSON, decryptJSON } from './encrypt';

const STORE_NAME = 'veil-wallet';
const DB_NAME = 'veil-db';

const store = createStore(DB_NAME, STORE_NAME);

/**
 * Store encrypted binary data.
 */
export async function setEncrypted(
  key: string,
  data: Uint8Array,
  encKey: CryptoKey,
): Promise<void> {
  const encrypted = await encrypt(encKey, data);
  await set(key, encrypted, store);
}

/**
 * Retrieve and decrypt binary data.
 */
export async function getEncrypted(
  key: string,
  encKey: CryptoKey,
): Promise<Uint8Array | null> {
  const encrypted = await get<ArrayBuffer>(key, store);
  if (!encrypted) return null;
  return decrypt(encKey, encrypted);
}

/**
 * Store an encrypted JSON object.
 */
export async function setEncryptedJSON<T>(
  key: string,
  data: T,
  encKey: CryptoKey,
): Promise<void> {
  const encrypted = await encryptJSON(encKey, data);
  await set(key, encrypted, store);
}

/**
 * Retrieve and decrypt a JSON object.
 */
export async function getEncryptedJSON<T>(
  key: string,
  encKey: CryptoKey,
): Promise<T | null> {
  const encrypted = await get<ArrayBuffer>(key, store);
  if (!encrypted) return null;
  return decryptJSON<T>(encKey, encrypted);
}

/**
 * Store unencrypted data (for public data like Merkle tree cache).
 */
export async function setPublic<T>(key: string, data: T): Promise<void> {
  await set(key, data, store);
}

/**
 * Retrieve unencrypted data.
 */
export async function getPublic<T>(key: string): Promise<T | null> {
  const result = await get<T>(key, store);
  return result ?? null;
}

/**
 * Delete a key from storage.
 */
export async function remove(key: string): Promise<void> {
  await del(key, store);
}

/**
 * List all keys in the store.
 */
export async function listKeys(): Promise<string[]> {
  const allKeys = await keys(store);
  return allKeys as string[];
}

/**
 * Clear all wallet data. Used for wallet reset/wipe.
 */
export async function clearAll(): Promise<void> {
  const allKeys = await listKeys();
  for (const key of allKeys) {
    await del(key, store);
  }
}
