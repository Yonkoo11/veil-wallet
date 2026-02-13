/**
 * AES-256-GCM encryption/decryption for local storage.
 * All wallet data stored in IndexedDB is encrypted with this.
 */

const IV_LENGTH = 12; // 96-bit IV for AES-GCM

export async function encrypt(
  key: CryptoKey,
  data: Uint8Array,
): Promise<ArrayBuffer> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    data as BufferSource,
  );

  // Prepend IV to ciphertext
  const result = new Uint8Array(IV_LENGTH + ciphertext.byteLength);
  result.set(iv);
  result.set(new Uint8Array(ciphertext), IV_LENGTH);

  return result.buffer;
}

export async function decrypt(
  key: CryptoKey,
  encryptedData: ArrayBuffer,
): Promise<Uint8Array> {
  const data = new Uint8Array(encryptedData);
  const iv = data.slice(0, IV_LENGTH);
  const ciphertext = data.slice(IV_LENGTH);

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ciphertext as BufferSource,
  );

  return new Uint8Array(plaintext);
}

/**
 * Encrypt a JSON-serializable object.
 */
export async function encryptJSON<T>(
  key: CryptoKey,
  data: T,
): Promise<ArrayBuffer> {
  const json = JSON.stringify(data);
  const encoded = new TextEncoder().encode(json);
  return encrypt(key, encoded);
}

/**
 * Decrypt to a JSON object.
 */
export async function decryptJSON<T>(
  key: CryptoKey,
  encryptedData: ArrayBuffer,
): Promise<T> {
  const decrypted = await decrypt(key, encryptedData);
  const json = new TextDecoder().decode(decrypted);
  return JSON.parse(json) as T;
}
