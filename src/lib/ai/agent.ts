import Groq from "groq-sdk";
import { getServerEnv, groqKeyFormatOk, hasGroqKey } from "@/config/env";
import { cryptoGptSystemPrompt } from "@/lib/ai/prompts";
import { CRYPTO_TOOLS, runTool } from "@/lib/ai/tools";
import { formatGroqError } from "@/lib/utils/groq-error";
import type { ChatRole } from "@/types/chat";

const MAX_TOOL_ROUNDS = 6;

export type AgentInput = {
  messages: Array<{ role: ChatRole; content: string }>;
  portfolioContext?: string;
};

export type AgentResult = {
  content: string;
  toolsUsed: string[];
};

export async function runCryptoAgent(input: AgentInput): Promise<AgentResult> {
  const env = getServerEnv();
  if (!hasGroqKey(env)) {
    throw new Error(
      "GROQ_API_KEY não configurada. Copie .env.example para .env.local e adicione sua chave.",
    );
  }

  if (!groqKeyFormatOk(env)) {
    throw new Error(
      "GROQ_API_KEY com formato inválido. Use a chave completa que começa com gsk_ (sem aspas nem espaços).",
    );
  }

  const client = new Groq({ apiKey: env.GROQ_API_KEY });
  const toolsUsed: string[] = [];

  const groqMessages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: cryptoGptSystemPrompt(input.portfolioContext),
    },
    ...input.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    let completion;
    try {
      completion = await client.chat.completions.create({
        model: env.GROQ_MODEL,
        messages: groqMessages,
        tools: CRYPTO_TOOLS,
        tool_choice: "auto",
        temperature: 0.4,
        max_tokens: 1200,
      });
    } catch (err) {
      throw new Error(formatGroqError(err));
    }

    const choice = completion.choices[0]?.message;
    if (!choice) {
      throw new Error("Resposta vazia do modelo");
    }

    groqMessages.push(choice);

    const toolCalls = choice.tool_calls;
    if (!toolCalls?.length) {
      const text = choice.content?.trim();
      if (!text) throw new Error("Resposta vazia do assistente");
      return { content: text, toolsUsed };
    }

    for (const call of toolCalls) {
      if (call.type !== "function") continue;
      const fn = call.function;
      toolsUsed.push(fn.name);
      const result = await runTool(fn.name, fn.arguments ?? "{}");
      groqMessages.push({
        role: "tool",
        tool_call_id: call.id,
        content: result,
      });
    }
  }

  throw new Error("Limite de chamadas de ferramentas atingido");
}
