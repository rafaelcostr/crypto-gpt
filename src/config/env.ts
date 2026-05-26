import { z } from "zod";

const envSchema = z.object({
  GROQ_API_KEY: z
    .string()
    .optional()
    .transform((s) => (s?.trim() ? s.trim() : undefined)),
  GROQ_MODEL: z.string().default("llama-3.3-70b-versatile"),
  COINGECKO_BASE_URL: z
    .string()
    .url()
    .default("https://api.coingecko.com/api/v3"),
});

export type ServerEnv = z.infer<typeof envSchema>;

export function getServerEnv(): ServerEnv {
  return envSchema.parse({
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_MODEL: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
    COINGECKO_BASE_URL:
      process.env.COINGECKO_BASE_URL ?? "https://api.coingecko.com/api/v3",
  });
}

export function hasGroqKey(env?: ServerEnv): boolean {
  const e = env ?? getServerEnv();
  return Boolean(e.GROQ_API_KEY);
}

/** Formato esperado pelas chaves atuais da Groq (gsk_...) */
export function groqKeyFormatOk(env?: ServerEnv): boolean {
  const key = (env ?? getServerEnv()).GROQ_API_KEY;
  if (!key) return false;
  return /^gsk_[A-Za-z0-9_-]{20,}$/.test(key);
}
