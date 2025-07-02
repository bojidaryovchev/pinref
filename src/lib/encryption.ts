import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

// In production, this should be stored securely (environment variable, key management service)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "your-32-character-secret-key-here!!";

function getKey(): Buffer {
  if (ENCRYPTION_KEY.length !== KEY_LENGTH) {
    // Hash the key to ensure it's exactly 32 bytes
    return crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
  }
  return Buffer.from(ENCRYPTION_KEY);
}

export function encrypt(text: string): string {
  try {
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher(ALGORITHM, key);
    cipher.setAAD(Buffer.from("bookmark-manager"));

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const tag = cipher.getAuthTag();

    // Combine iv + tag + encrypted data
    return iv.toString("hex") + tag.toString("hex") + encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

export function decrypt(encryptedData: string): string {
  try {
    const key = getKey();

    // Extract iv, tag, and encrypted data
    const iv = Buffer.from(encryptedData.slice(0, IV_LENGTH * 2), "hex");
    const tag = Buffer.from(encryptedData.slice(IV_LENGTH * 2, (IV_LENGTH + TAG_LENGTH) * 2), "hex");
    const encrypted = encryptedData.slice((IV_LENGTH + TAG_LENGTH) * 2);

    const decipher = crypto.createDecipher(ALGORITHM, key);
    decipher.setAAD(Buffer.from("bookmark-manager"));
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}

export function hashForSearch(text: string): string {
  // Create a hash that can be used for search indexing
  // This is one-way and doesn't reveal the original content
  return crypto.createHash("sha256").update(text.toLowerCase()).digest("hex");
}

export function generateSearchTokens(text: string): string[] {
  if (!text) return [];

  const normalizedText = text.toLowerCase();
  const tokens = new Set<string>();

  // Split by word boundaries and create hashed n-grams
  const words = normalizedText.split(/\s+/);

  for (const word of words) {
    if (word.length > 0) {
      // Hash individual words
      tokens.add(hashForSearch(word));

      // Create n-grams for partial matching
      for (let i = 0; i < word.length - 1; i++) {
        for (let j = i + 2; j <= word.length; j++) {
          tokens.add(hashForSearch(word.slice(i, j)));
        }
      }
    }
  }

  return Array.from(tokens);
}

// Utility functions for encrypting specific data types
export function encryptBookmarkData(data: { url: string; title?: string; description?: string }) {
  return {
    url: encrypt(data.url),
    title: data.title ? encrypt(data.title) : undefined,
    description: data.description ? encrypt(data.description) : undefined,
  };
}

export function decryptBookmarkData(encryptedData: { url: string; title?: string; description?: string }) {
  return {
    url: decrypt(encryptedData.url),
    title: encryptedData.title ? decrypt(encryptedData.title) : undefined,
    description: encryptedData.description ? decrypt(encryptedData.description) : undefined,
  };
}

export function encryptCategoryData(data: { name: string }) {
  return {
    name: encrypt(data.name),
  };
}

export function decryptCategoryData(encryptedData: { name: string }) {
  return {
    name: decrypt(encryptedData.name),
  };
}

export function encryptTagData(data: { name: string }) {
  return {
    name: encrypt(data.name),
  };
}

export function decryptTagData(encryptedData: { name: string }) {
  return {
    name: decrypt(encryptedData.name),
  };
}
