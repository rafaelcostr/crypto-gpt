import Groq from "groq-sdk";
import { getServerEnv, groqKeyFormatOk, hasGroqKey } from "@/config/env";
import { fetchCryptoNews, formatNewsForPrompt } from "@/lib/integrations/news";
import { formatGroqError } from "@/lib/utils/groq-error";

export async function GET(req: Request) {
  const summarize = new URL(req.url).searchParams.get("summarize") === "1";

  try {
    const items = await fetchCryptoNews();

    if (!summarize) {
      return Response.json({ items });
    }

    const env = getServerEnv();
    if (!hasGroqKey(env)) {
      return Response.json({
        items,
        summary:
          "Configure GROQ_API_KEY em .env.local para resumo automático por IA.",
      });
    }

    if (!groqKeyFormatOk(env)) {
      return Response.json({
        items,
        summary:
          "GROQ_API_KEY com formato inválido. Use a chave completa gsk_... em .env.local.",
      });
    }

    const client = new Groq({ apiKey: env.GROQ_API_KEY });
    const headlines = formatNewsForPrompt(items, 8);
    let completion;
    try {
      completion = await client.chat.completions.create({
        model: env.GROQ_MODEL,
        temperature: 0.3,
        max_tokens: 600,
        messages: [
          {
            role: "system",
            content:
              "Resuma as manchetes em português do Brasil: 4 bullets curtos + 1 linha de sentimento geral (neutro). Não invente fatos além das manchetes.",
          },
          { role: "user", content: headlines },
        ],
      });
    } catch (err) {
      return Response.json({
        items,
        summary: formatGroqError(err),
      });
    }

    const summary =
      completion.choices[0]?.message?.content?.trim() ??
      "Não foi possível gerar o resumo.";

    return Response.json({ items, summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao buscar notícias";
    return Response.json({ error: message }, { status: 502 });
  }
}
