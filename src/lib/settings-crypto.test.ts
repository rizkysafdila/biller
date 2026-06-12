import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { encryptSecret, decryptSecret } from "./settings-crypto";

// A valid 32-byte key as 64 hex chars.
const KEY = "0".repeat(64);

describe("settings-crypto", () => {
  beforeEach(() => {
    process.env.SETTINGS_ENCRYPTION_KEY = KEY;
  });
  afterEach(() => {
    delete process.env.SETTINGS_ENCRYPTION_KEY;
  });

  it("round-trips a secret through encrypt/decrypt", () => {
    const plain = "AIzaSyExample-secret-key-1234";
    const enc = encryptSecret(plain);
    expect(enc).not.toContain(plain);
    expect(decryptSecret(enc)).toBe(plain);
  });

  it("produces a different ciphertext each time (random IV)", () => {
    const a = encryptSecret("same");
    const b = encryptSecret("same");
    expect(a).not.toBe(b);
    expect(decryptSecret(a)).toBe("same");
    expect(decryptSecret(b)).toBe("same");
  });

  it("stores ciphertext as three colon-joined base64 parts", () => {
    const parts = encryptSecret("x").split(":");
    expect(parts).toHaveLength(3);
    for (const p of parts) {
      expect(p).toMatch(/^[A-Za-z0-9+/]+=*$/);
    }
  });

  it("throws when the key env var is missing", () => {
    delete process.env.SETTINGS_ENCRYPTION_KEY;
    expect(() => encryptSecret("x")).toThrow(/SETTINGS_ENCRYPTION_KEY/);
  });

  it("throws when the key env var is not 32 bytes of hex", () => {
    process.env.SETTINGS_ENCRYPTION_KEY = "deadbeef";
    expect(() => encryptSecret("x")).toThrow(/SETTINGS_ENCRYPTION_KEY/);
  });

  it("throws when ciphertext has been tampered with", () => {
    const enc = encryptSecret("secret");
    const [iv, tag] = enc.split(":");
    // Flip the ciphertext; the GCM auth tag check must fail.
    const tampered = `${iv}:${tag}:${Buffer.from("different").toString("base64")}`;
    expect(() => decryptSecret(tampered)).toThrow();
  });
});
