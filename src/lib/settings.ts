import "server-only";
import { db } from "./db";
import { decryptSecret } from "./settings-crypto";

// Resolves the effective Gemini config for OCR. Settings saved from the console
// (stored in the shared DB) take precedence; otherwise we fall back to the
// GEMINI_API_KEY / GEMINI_MODEL env vars, then a sane default model. This keeps
// existing env-only deployments working with no behavior change.

const DEFAULT_MODEL = "gemini-2.0-flash";

export type GeminiConfig = { apiKey: string | undefined; model: string };

export async function getGeminiConfig(): Promise<GeminiConfig> {
  const rows = await db.setting.findMany({
    where: { key: { in: ["gemini_api_key", "gemini_model"] } },
  });
  const byKey = new Map(rows.map((r) => [r.key, r.value]));

  const encryptedKey = byKey.get("gemini_api_key");
  const apiKey = encryptedKey
    ? decryptSecret(encryptedKey)
    : process.env.GEMINI_API_KEY || undefined;

  const model = byKey.get("gemini_model") || process.env.GEMINI_MODEL || DEFAULT_MODEL;

  return { apiKey, model };
}
