"use client";

import { useEffect, useState } from "react";
import type { NewsItem } from "@/types/market";

export function NewsPanel() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [summarizing, setSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/news")
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error);
        return r.json() as Promise<{ items: NewsItem[] }>;
      })
      .then((j) => setItems(j.items ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "Erro"))
      .finally(() => setLoading(false));
  }, []);

  const summarize = async () => {
    setSummarizing(true);
    setError(null);
    try {
      const res = await fetch("/api/news?summarize=1");
      const json = (await res.json()) as {
        items: NewsItem[];
        summary?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Erro");
      setItems(json.items ?? []);
      setSummary(json.summary ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Notícias</h1>
          <p className="text-sm text-zinc-500">Feed CoinDesk (RSS)</p>
        </div>
        <button
          type="button"
          onClick={() => void summarize()}
          disabled={summarizing || loading}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-[#06080f] disabled:opacity-40 hover:bg-emerald-400"
        >
          {summarizing ? "Resumindo com IA…" : "Resumo com IA"}
        </button>
      </div>

      {summary && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm whitespace-pre-wrap leading-relaxed">
          {summary}
        </div>
      )}

      {error && <p className="text-sm text-rose-400">{error}</p>}

      {loading ? (
        <p className="text-sm text-zinc-500">Carregando…</p>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => (
            <li
              key={n.id}
              className="rounded-xl border border-white/10 bg-[#0c101c] p-4 hover:border-emerald-500/20 transition-colors"
            >
              <a
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-100 hover:text-emerald-300"
              >
                {n.title}
              </a>
              <p className="text-xs text-zinc-500 mt-2">
                {n.source} ·{" "}
                {new Date(n.publishedAt).toLocaleString("pt-BR")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
