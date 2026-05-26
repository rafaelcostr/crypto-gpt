"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadHoldings,
  saveHoldings,
} from "@/lib/portfolio/storage";
import {
  formatBrl,
  formatPct,
  formatUsd,
  newId,
  pctClass,
} from "@/lib/utils/format";
import type { CoinSearchResult } from "@/types/market";
import type { PortfolioHolding } from "@/types/portfolio";

type PriceRow = {
  usd: number;
  brl: number;
  change24hPct: number | null;
};

export function PortfolioManager() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceRow>>({});
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CoinSearchResult[]>([]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setHoldings(loadHoldings());
  }, []);

  const refreshPrices = useCallback(async (list: PortfolioHolding[]) => {
    if (!list.length) {
      setPrices({});
      return;
    }
    const ids = list.map((h) => h.coinId).join(",");
    const res = await fetch(`/api/coins/price?ids=${encodeURIComponent(ids)}`);
    if (!res.ok) return;
    const json = (await res.json()) as {
      prices: Record<string, PriceRow>;
    };
    setPrices(json.prices ?? {});
  }, []);

  useEffect(() => {
    void refreshPrices(holdings);
    const t = setInterval(() => void refreshPrices(holdings), 60_000);
    return () => clearInterval(t);
  }, [holdings, refreshPrices]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/coins/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((j: { coins: CoinSearchResult[] }) => setResults(j.coins ?? []))
        .catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const persist = (next: PortfolioHolding[]) => {
    setHoldings(next);
    saveHoldings(next);
    void refreshPrices(next);
  };

  const addHolding = (coin: CoinSearchResult) => {
    const qty = parseFloat(amount.replace(",", "."));
    if (!qty || qty <= 0) return;
    const next: PortfolioHolding = {
      id: newId(),
      coinId: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      amount: qty,
    };
    persist([...holdings.filter((h) => h.coinId !== coin.id), next]);
    setQuery("");
    setAmount("");
    setResults([]);
  };

  const remove = (id: string) => {
    persist(holdings.filter((h) => h.id !== id));
  };

  let totalUsd = 0;
  let totalBrl = 0;
  const lines = holdings.map((h) => {
    const p = prices[h.coinId];
    const valueUsd = p ? h.amount * p.usd : 0;
    const valueBrl = p ? h.amount * p.brl : 0;
    totalUsd += valueUsd;
    totalBrl += valueBrl;
    return { h, p, valueUsd, valueBrl };
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-[#0c101c] p-5">
        <h2 className="text-lg font-semibold mb-1">Adicionar ativo</h2>
        <p className="text-sm text-zinc-500 mb-4">
          Busca CoinGecko · salvo no navegador (localStorage)
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: bitcoin, solana"
            className="flex-1 rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm"
          />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Quantidade"
            className="w-full sm:w-32 rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm"
          />
        </div>
        {results.length > 0 && (
          <ul className="mt-2 border border-white/10 rounded-lg divide-y divide-white/5 overflow-hidden">
            {results.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => addHolding(c)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-500/10 flex justify-between"
                >
                  <span>
                    {c.name}{" "}
                    <span className="text-zinc-500 uppercase">{c.symbol}</span>
                  </span>
                  <span className="text-zinc-500">Adicionar</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0c101c] p-5">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold">Sua carteira</h2>
            <p className="text-2xl font-semibold text-emerald-300 mt-1">
              {formatUsd(totalUsd)}
            </p>
            <p className="text-sm text-zinc-500">{formatBrl(totalBrl)}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void refreshPrices(holdings).finally(() => setLoading(false));
            }}
            className="text-sm px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5"
            disabled={loading}
          >
            {loading ? "Atualizando…" : "Atualizar preços"}
          </button>
        </div>

        {holdings.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhum ativo ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-500 text-left">
                <th className="pb-2">Ativo</th>
                <th className="pb-2">Qtd</th>
                <th className="pb-2">Valor</th>
                <th className="pb-2">24h</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lines.map(({ h, p, valueUsd }) => (
                <tr key={h.id} className="border-t border-white/5">
                  <td className="py-3">
                    <span className="font-medium">{h.name}</span>
                    <span className="text-zinc-500 ml-1 uppercase text-xs">
                      {h.symbol}
                    </span>
                  </td>
                  <td className="py-3">{h.amount}</td>
                  <td className="py-3">{p ? formatUsd(valueUsd) : "—"}</td>
                  <td className={`py-3 ${pctClass(p?.change24hPct ?? null)}`}>
                    {formatPct(p?.change24hPct ?? null)}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => remove(h.id)}
                      className="text-rose-400/80 hover:text-rose-300 text-xs"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
