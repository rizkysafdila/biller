import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Symmetric encryption for secrets stored in the shared DB (currently the
// Gemini API key set from the console). AES-256-GCM with a per-secret random
// IV. The key comes from SETTINGS_ENCRYPTION_KEY, which MUST be set to the same
// 32-byte (64 hex chars) value in both the console and the main app.
//
// Stored format: "<iv>:<authTag>:<ciphertext>", each part base64.

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // standard nonce length for GCM

function getKey(): Buffer {
  const hex = process.env.SETTINGS_ENCRYPTION_KEY;
  if (!hex) {
    throw new Error("SETTINGS_ENCRYPTION_KEY is not set.");
  }
  const key = Buffer.from(hex, "hex");
  if (key.length !== 32) {
    throw new Error(
      "SETTINGS_ENCRYPTION_KEY must be 32 bytes encoded as 64 hex characters.",
    );
  }
  return key;
}

export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

export function decryptSecret(stored: string): string {
  const key = getKey();
  const [ivB64, tagB64, dataB64] = stored.split(":");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Malformed encrypted secret.");
  }
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
