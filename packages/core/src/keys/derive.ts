/**
 * Key derivation from authentication secret (passkey or password).
 *
 * Key hierarchy:
 *   Auth Secret (passkey/password)
 *     -> Master Seed (PBKDF2)
 *       -> Railgun Spending Key (mnemonic from entropy)
 *       -> Smart Wallet Owner Key (ECDSA, derivation path m/44'/60'/0'/0/0)
 *       -> Encryption Key (for local storage)
 */

const PBKDF2_ITERATIONS = 600_000;
const SALT_PREFIX = new TextEncoder().encode('veil-wallet-v1');

export async function deriveMasterSeed(
  authSecret: Uint8Array,
  salt?: Uint8Array,
): Promise<Uint8Array> {
  const effectiveSalt = salt ?? generateSalt(authSecret);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    authSecret as BufferSource,
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: effectiveSalt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  );

  return new Uint8Array(bits);
}

export async function deriveEncryptionKey(
  masterSeed: Uint8Array,
): Promise<CryptoKey> {
  // Derive a separate key for encryption using HKDF
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    masterSeed as BufferSource,
    'HKDF',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new TextEncoder().encode('veil-encryption-key'),
      info: new TextEncoder().encode('aes-256-gcm'),
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function deriveOwnerKeyBytes(
  masterSeed: Uint8Array,
): Promise<Uint8Array> {
  // Derive smart wallet owner key using HKDF with different info
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    masterSeed as BufferSource,
    'HKDF',
    false,
    ['deriveBits'],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new TextEncoder().encode('veil-owner-key'),
      info: new TextEncoder().encode('secp256k1'),
    },
    keyMaterial,
    256,
  );

  return new Uint8Array(bits);
}

export async function deriveMnemonicEntropy(
  masterSeed: Uint8Array,
): Promise<Uint8Array> {
  // Derive Railgun mnemonic entropy using HKDF with different info
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    masterSeed as BufferSource,
    'HKDF',
    false,
    ['deriveBits'],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new TextEncoder().encode('veil-railgun-mnemonic'),
      info: new TextEncoder().encode('bip39-entropy'),
    },
    keyMaterial,
    128, // 128 bits = 12-word mnemonic
  );

  return new Uint8Array(bits);
}

function generateSalt(authSecret: Uint8Array): Uint8Array {
  // Deterministic salt from auth secret prefix + constant
  // This ensures same passkey always derives same master seed
  const combined = new Uint8Array(SALT_PREFIX.length + 8);
  combined.set(SALT_PREFIX);
  // Use first 8 bytes of authSecret hash as salt component
  // (full authSecret goes through PBKDF2, this just diversifies the salt)
  combined.set(authSecret.slice(0, 8), SALT_PREFIX.length);
  return combined;
}

/**
 * Derive a hex-encoded encryption key for Railgun's internal storage.
 * Railgun's createRailgunWallet expects a hex string, not a CryptoKey.
 */
export async function deriveRailgunEncryptionKey(
  masterSeed: Uint8Array,
): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    masterSeed as BufferSource,
    'HKDF',
    false,
    ['deriveBits'],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new TextEncoder().encode('veil-railgun-encryption'),
      info: new TextEncoder().encode('railgun-db-encryption-key'),
    },
    keyMaterial,
    256,
  );

  return Array.from(new Uint8Array(bits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Zero out sensitive key material from memory.
 * Call this after keys are no longer needed.
 */
export function zeroize(data: Uint8Array): void {
  data.fill(0);
}
