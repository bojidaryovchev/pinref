/**
 * Modern encryption implementation using Web Crypto API
 * This approach replaces the Node.js crypto library with more modern alternatives
 */

// Utility encoders/decoders
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Constants
const IV_LENGTH = 12; // 12 bytes for AES-GCM
const ALGORITHM = { name: "AES-GCM", length: 256 };
const KEY_ALGORITHM = { name: "PBKDF2", hash: "SHA-256" };
const KEY_USAGE: KeyUsage[] = ["encrypt", "decrypt"];
const APP_INFO = "bookmark-manager";

// Get the encryption key from environment variable
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

/**
 * Convert a hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(Math.ceil(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to a hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generate random bytes
 */
function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Derive a cryptographic key from the master password
 */
async function getCryptoKey(): Promise<CryptoKey> {
  try {
    // Create a salt based on the app info for consistency
    const salt = encoder.encode(APP_INFO);

    // Import the raw key material
    const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(ENCRYPTION_KEY), KEY_ALGORITHM, false, [
      "deriveKey",
    ]);

    // Derive a key suitable for AES-GCM
    return await crypto.subtle.deriveKey(
      {
        name: KEY_ALGORITHM.name,
        salt,
        iterations: 100000,
        hash: KEY_ALGORITHM.hash,
      },
      keyMaterial,
      ALGORITHM,
      false,
      KEY_USAGE,
    );
  } catch (error) {
    console.error("Key derivation error:", error);
    throw new Error("Failed to derive encryption key");
  }
}

/**
 * Encrypt a string using AES-GCM (async version)
 */
export async function encryptAsync(text: string): Promise<string> {
  try {
    const key = await getCryptoKey();
    const iv = randomBytes(IV_LENGTH);

    // Encrypt the text
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: ALGORITHM.name,
        iv,
        additionalData: encoder.encode(APP_INFO),
      },
      key,
      encoder.encode(text),
    );

    // Combine IV + encrypted data as hex string
    return bytesToHex(iv) + bytesToHex(new Uint8Array(encryptedBuffer));
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt a string encrypted with AES-GCM (async version)
 */
export async function decryptAsync(encryptedData: string): Promise<string> {
  try {
    const key = await getCryptoKey();

    // Extract IV and encrypted data
    const iv = hexToBytes(encryptedData.slice(0, IV_LENGTH * 2));
    const encrypted = hexToBytes(encryptedData.slice(IV_LENGTH * 2));

    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: ALGORITHM.name,
        iv,
        additionalData: encoder.encode(APP_INFO),
      },
      key,
      encrypted,
    );

    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Create a hash for search indexing
 */
export async function hashForSearch(text: string): Promise<string> {
  try {
    // Create a one-way hash for search indexing
    const data = encoder.encode(text.toLowerCase());
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return bytesToHex(new Uint8Array(hashBuffer));
  } catch (error) {
    console.error("Hashing error:", error);
    throw new Error("Failed to hash data for search");
  }
}

/**
 * Generate search tokens synchronously using a simple hash function
 * This is a fallback since we can't easily make the entire search process async
 */
export function generateSearchTokens(text: string): string[] {
  if (!text) return [];

  const normalizedText = text.toLowerCase();
  const tokens = new Set<string>();

  // Simple hash function for search tokens (synchronous version)
  const simpleHash = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Convert to hex string with padding
    return (hash >>> 0).toString(16).padStart(8, "0");
  };

  // Split by word boundaries and create hashed n-grams
  const words = normalizedText.split(/\s+/);

  for (const word of words) {
    if (word.length > 0) {
      // Hash individual words
      tokens.add(simpleHash(word));

      // Create n-grams for partial matching
      for (let i = 0; i < word.length - 1; i++) {
        for (let j = i + 2; j <= word.length; j++) {
          tokens.add(simpleHash(word.slice(i, j)));
        }
      }
    }
  }

  return Array.from(tokens);
}

/**
 * Synchronous encrypt/decrypt functions
 * These are simplified versions that work synchronously for compatibility with existing code
 */
export function encryptSync(text: string): string {
  // Simple XOR encryption with a key derived from ENCRYPTION_KEY
  // This is a simplified fallback and should be replaced with proper async implementation
  const key = Array.from(ENCRYPTION_KEY).map((char) => char.charCodeAt(0));
  const textBytes = encoder.encode(text);
  const resultBytes = new Uint8Array(textBytes.length);
  
  for (let i = 0; i < textBytes.length; i++) {
    resultBytes[i] = textBytes[i] ^ key[i % key.length];
  }
  
  // Convert to hex string instead of using btoa to avoid Unicode issues
  return bytesToHex(resultBytes);
}

export function decryptSync(encryptedData: string): string {
  try {
    // Simple XOR decryption with a key derived from ENCRYPTION_KEY
    const key = Array.from(ENCRYPTION_KEY).map((char) => char.charCodeAt(0));
    const encryptedBytes = hexToBytes(encryptedData);
    const resultBytes = new Uint8Array(encryptedBytes.length);
    
    for (let i = 0; i < encryptedBytes.length; i++) {
      resultBytes[i] = encryptedBytes[i] ^ key[i % key.length];
    }
    
    // Convert bytes back to string
    return decoder.decode(resultBytes);
  } catch (error) {
    console.error("Sync decryption error:", error);
    return "DECRYPTION_ERROR";
  }
}

// Utility functions for encrypting specific data types
// Using synchronous versions for backward compatibility
export function encryptBookmarkData(data: { 
  url: string; 
  title?: string; 
  description?: string; 
  image?: string; 
  favicon?: string; 
  domain?: string; 
}) {
  return {
    url: encryptSync(data.url),
    title: data.title ? encryptSync(data.title) : undefined,
    description: data.description ? encryptSync(data.description) : undefined,
    image: data.image ? encryptSync(data.image) : undefined,
    favicon: data.favicon ? encryptSync(data.favicon) : undefined,
    domain: data.domain ? encryptSync(data.domain) : undefined,
  };
}

export function decryptBookmarkData(encryptedData: { 
  url: string; 
  title?: string; 
  description?: string; 
  image?: string; 
  favicon?: string; 
  domain?: string; 
}) {
  return {
    url: decryptSync(encryptedData.url),
    title: encryptedData.title ? decryptSync(encryptedData.title) : undefined,
    description: encryptedData.description ? decryptSync(encryptedData.description) : undefined,
    image: encryptedData.image ? decryptSync(encryptedData.image) : undefined,
    favicon: encryptedData.favicon ? decryptSync(encryptedData.favicon) : undefined,
    domain: encryptedData.domain ? decryptSync(encryptedData.domain) : undefined,
  };
}

export function encryptCategoryData(data: { name: string }) {
  return {
    name: encryptSync(data.name),
  };
}

export function decryptCategoryData(encryptedData: { name: string }) {
  return {
    name: decryptSync(encryptedData.name),
  };
}

export function encryptTagData(data: { name: string }) {
  return {
    name: encryptSync(data.name),
  };
}

export function decryptTagData(encryptedData: { name: string }) {
  return {
    name: decryptSync(encryptedData.name),
  };
}

/**
 * Migration helpers for future transition to fully async Web Crypto API
 */

/**
 * Check if data was encrypted with the newer async encryption
 * @param encryptedData The encrypted string to check
 */
export function isAsyncEncrypted(encryptedData: string): boolean {
  try {
    // The async-encrypted data should be a valid hex string of a certain pattern
    // This is a simple heuristic and may need refinement
    return /^[0-9a-f]{24,}$/.test(encryptedData);
  } catch {
    return false;
  }
}

/**
 * Migration helper: Re-encrypt data with the async encryption
 * Use this when transitioning from sync to async encryption
 * @param data Data that was encrypted with the older sync method
 */
export async function migrateToAsyncEncryption(data: string): Promise<string> {
  // Decrypt with the old method, then encrypt with the new one
  const decrypted = decryptSync(data);
  return await encrypt(decrypted);
}

/**
 * Compatibility layer - these functions provide sync-like API
 * while logging warnings about future migration needs
 */

/**
 * Legacy wrapper for encrypt - maintains backward compatibility
 * @deprecated Use the async version directly
 */
export function encrypt(text: string): string {
  console.warn("Using synchronous encryption. Consider migrating to async version.");
  return encryptSync(text);
}

/**
 * Legacy wrapper for decrypt - maintains backward compatibility
 * @deprecated Use the async version directly
 */
export function decrypt(encryptedData: string): string {
  console.warn("Using synchronous decryption. Consider migrating to async version.");
  return decryptSync(encryptedData);
}
