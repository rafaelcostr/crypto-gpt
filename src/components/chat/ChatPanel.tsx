"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearChatMessages,
  loadChatMessages,
  messagesForApi,
  saveChatMessages,
  WELCOME_MESSAGE,
} from "@/lib/chat/storage";
import {
  formatPortfolioContext,
  loadHoldings,
} from "@/lib/portfolio/storage";
import { newId } from "@/lib/utils/format";
import type { ChatMessage, ChatResponseBody } from "@/types/chat";

const STARTERS = [
  "Qual o preço do Bitcoin agora?",
  "Resumo do mercado hoje",
  "Últimas notícias de cripto",
  "Como está minha carteira?",
];

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groqReady, setGroqReady] = useState<boolean | null>(null);
  const [groqHint, setGroqHint] = useState<"missing" | "format" | "ok">("missing");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(loadChatMessages());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveChatMessages(messages);
  }, [messages, hydrated]);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then(
        (j: {
          groqConfigured?: boolean;
          groqKeyFormatOk?: boolean;
          hint?: "missing" | "format" | "ok";
        }) => {
          const hint = j.hint ?? (j.groqConfigured ? "ok" : "missing");
          setGroqHint(hint);
          setGroqReady(
            Boolean(j.groqConfigured) && Boolean(j.groqKeyFormatOk ?? true),
          );
        },
      )
      .catch(() => {
        setGroqReady(false);
        setGroqHint("missing");
      });
  }, []);

  const scrollDown = () => {
    requestAnimationFrame(() =>
      bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
    );
  };

  const buildPortfolioContext = useCallback(async () => {
    const holdings = loadHoldings();
    if (!holdings.length) return undefined;
    const ids = holdings.map((h) => h.coinId).join(",");
    const res = await fetch(`/api/coins/price?ids=${encodeURIComponent(ids)}`);
    if (!res.ok) return formatPortfolioContext(holdings, {});
    const json = (await res.json()) as {
      prices: Record<string, { usd: number; change24hPct: number | null }>;
    };
    return formatPortfolioContext(holdings, json.prices ?? {});
  }, []);

  const clearConversation = () => {
    clearChatMessages();
    setMessages([{ ...WELCOME_MESSAGE, createdAt: new Date().toISOString() }]);
    setError(null);
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    if (groqReady === false) {
      setError(
        "Configure GROQ_API_KEY em .env.local e reinicie o servidor (npm run dev).",
      );
      return;
    }

    const userMsg: ChatMessage = {
      id: newId(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);
    scrollDown();

    try {
      const portfolioContext = await buildPortfolioContext();
      const payload = {
        messages: messagesForApi(nextMessages),
        portfolioContext,
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as ChatResponseBody & { error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "Falha no chat");
      }

      setMessages((prev) => [...prev, json.message]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
      scrollDown();
    }
  };

  const hasHistory = messages.some((m) => m.role === "user");

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <section className="flex-1 flex flex-col min-h-[480px] rounded-xl border border-white/10 bg-[#0c101c] overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-white/5 text-xs text-zinc-500">
          <span>
            {hydrated && hasHistory
              ? "Conversa salva neste navegador"
              : "Histórico local ao enviar mensagens"}
          </span>
          {hasHistory && (
            <button
              type="button"
              onClick={clearConversation}
              className="text-zinc-400 hover:text-rose-300 transition-colors"
            >
              Nova conversa
            </button>
          )}
        </div>

        {groqReady === false && (
          <div className="mx-4 mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
            <p className="font-medium text-amber-200">
              {groqHint === "format"
                ? "Chave Groq com formato inválido"
                : "Chat desativado — falta API Groq"}
            </p>
            <ol className="mt-2 list-decimal list-inside space-y-1 text-xs text-amber-100/80">
              <li>
                Crie uma chave em{" "}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-amber-50"
                >
                  console.groq.com/keys
                </a>{" "}
                (começa com <code className="text-amber-200">gsk_</code>)
              </li>
              <li>
                Em <code className="text-amber-200">.env.local</code>, uma linha
                só:{" "}
                <code className="text-amber-200">GROQ_API_KEY=gsk_sua_chave</code>{" "}
                — sem aspas, sem espaços no início
              </li>
              <li>Pare o servidor (Ctrl+C) e rode de novo: npm run dev</li>
            </ol>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!hydrated ? (
            <p className="text-xs text-zinc-500 animate-pulse">
              Carregando conversa…
            </p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-emerald-600/20 text-emerald-50 border border-emerald-500/20"
                      : "bg-white/5 text-zinc-200 border border-white/10"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))
          )}
          {loading && (
            <p className="text-xs text-zinc-500 animate-pulse">Analisando…</p>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <p className="px-4 text-xs text-rose-400 border-t border-white/5 py-2">
            {error}
          </p>
        )}

        <form
          className="border-t border-white/10 p-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte sobre BTC, mercado, notícias…"
            className="flex-1 rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
            disabled={loading || groqReady === false || !hydrated}
          />
          <button
            type="submit"
            disabled={
              loading || !input.trim() || groqReady === false || !hydrated
            }
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-[#06080f] disabled:opacity-40 hover:bg-emerald-400 transition-colors"
          >
            Enviar
          </button>
        </form>
      </section>

      <aside className="lg:w-64 shrink-0 space-y-3">
        <p className="text-xs text-zinc-500 uppercase tracking-wide">
          Sugestões
        </p>
        {STARTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => void send(s)}
            disabled={loading || groqReady === false || !hydrated}
            className="w-full text-left text-sm rounded-lg border border-white/10 px-3 py-2 text-zinc-300 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </aside>
    </div>
  );
}
