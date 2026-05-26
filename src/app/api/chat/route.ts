import { z } from "zod";
import { runCryptoAgent } from "@/lib/ai/agent";
import { newId } from "@/lib/utils/format";
import type { ChatResponseBody } from "@/types/chat";

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(40),
  portfolioContext: z.string().max(8000).optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return Response.json(
        { error: "Corpo inválido", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await runCryptoAgent({
      messages: parsed.data.messages,
      portfolioContext: parsed.data.portfolioContext,
    });

    const body: ChatResponseBody = {
      message: {
        id: newId(),
        role: "assistant",
        content: result.content,
        createdAt: new Date().toISOString(),
      },
      toolsUsed: result.toolsUsed.length ? result.toolsUsed : undefined,
    };

    return Response.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    const status = message.includes("GROQ_API_KEY")
      ? 503
      : message.includes("Chave Groq inválida")
        ? 401
        : 500;
    return Response.json({ error: message }, { status });
  }
}
