import { messageFromUnknown } from "@/lib/utils/api-error";

const INVALID_KEY_HINT =
  "Chave Groq inválida ou expirada. Gere uma nova em https://console.groq.com/keys , " +
  "cole em .env.local como GROQ_API_KEY=gsk_... (sem aspas extras), salve e reinicie: npm run dev";

function isInvalidKeyPayload(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("invalid api key") ||
    lower.includes("invalid_api_key") ||
    lower.includes('"code":"invalid_api_key"')
  );
}

export function formatGroqError(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as {
      status?: number;
      message?: string;
      error?: { message?: string; code?: string };
    };

    if (
      e.status === 401 ||
      e.error?.code === "invalid_api_key" ||
      isInvalidKeyPayload(JSON.stringify(e))
    ) {
      return INVALID_KEY_HINT;
    }
  }

  if (err instanceof Error) {
    if (isInvalidKeyPayload(err.message)) return INVALID_KEY_HINT;

    try {
      const parsed = JSON.parse(err.message) as {
        error?: { message?: string; code?: string };
      };
      if (
        parsed.error?.code === "invalid_api_key" ||
        isInvalidKeyPayload(parsed.error?.message ?? "")
      ) {
        return INVALID_KEY_HINT;
      }
    } catch {
      /* not JSON */
    }
  }

  return messageFromUnknown(err, "Erro ao contatar a API Groq");
}
