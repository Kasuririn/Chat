/**
 * AegisCrypt Web Crypto E2EE Engine
 * Provides AES-GCM 256-bit encryption/decryption, PBKDF2 key derivation,
 * and cryptographic fingerprint generation (Safety Numbers).
 */

// Utility: ArrayBuffer <-> Base64
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Derive AES-GCM CryptoKey from passphrase using PBKDF2
export async function deriveKeyFromPassphrase(
  passphrase: string,
  saltUint8: Uint8Array
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltUint8 as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt plaintext string with AES-GCM
export async function encryptText(
  plaintext: string,
  passphrase: string
): Promise<{ ciphertext: string; iv: string; salt: string; algorithm: string }> {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyFromPassphrase(passphrase, salt);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    enc.encode(plaintext)
  );

  return {
    ciphertext: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
    algorithm: 'AES-GCM-256/PBKDF2-SHA256',
  };
}

// Decrypt ciphertext string with AES-GCM
export async function decryptText(
  encrypted: { ciphertext: string; iv: string; salt: string },
  passphrase: string
): Promise<string> {
  const salt = new Uint8Array(base64ToBuffer(encrypted.salt));
  const iv = new Uint8Array(base64ToBuffer(encrypted.iv));
  const cipherBuffer = base64ToBuffer(encrypted.ciphertext);

  const key = await deriveKeyFromPassphrase(passphrase, salt);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    cipherBuffer as unknown as BufferSource
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}

// Encrypt binary data (images, voice notes, files)
export async function encryptFile(
  dataBuffer: ArrayBuffer,
  passphrase: string
): Promise<{ encryptedData: string; iv: string; salt: string }> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyFromPassphrase(passphrase, salt);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    dataBuffer as unknown as BufferSource
  );

  return {
    encryptedData: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
  };
}

// Decrypt binary data
export async function decryptFile(
  encryptedData: string,
  ivBase64: string,
  saltBase64: string,
  passphrase: string
): Promise<ArrayBuffer> {
  const salt = new Uint8Array(base64ToBuffer(saltBase64));
  const iv = new Uint8Array(base64ToBuffer(ivBase64));
  const cipherBuffer = base64ToBuffer(encryptedData);

  const key = await deriveKeyFromPassphrase(passphrase, salt);

  return window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    cipherBuffer as unknown as BufferSource
  );
}

// Generate cryptographic Safety Number / Fingerprint for verifying room integrity
export async function generateSafetyNumber(seedA: string, seedB: string = 'aegis-salt'): Promise<string> {
  const enc = new TextEncoder();
  const sortedSeeds = [seedA, seedB].sort().join('::');
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', enc.encode(sortedSeeds));
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // Convert hash to chunks of digits (e.g. 12 groups of 5 digits)
  let numeric = '';
  for (let i = 0; i < hashArray.length; i++) {
    numeric += (hashArray[i] % 10).toString();
  }
  // Format as 6 blocks of 5 digits (30 digits total)
  const chunks = [];
  for (let i = 0; i < 30; i += 5) {
    chunks.push(numeric.slice(i, i + 5));
  }
  return chunks.join(' ');
}

// Generate an ECDH Keypair for user identity
export async function generateIdentityKeyPair(): Promise<CryptoKeyPair> {
  return window.crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveKey', 'deriveBits']
  );
}

// Generate a random room key phrase (e.g. 16 chars readable hex or words)
export function generateRandomSecret(): string {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
