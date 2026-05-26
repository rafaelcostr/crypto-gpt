"use client";

import { useEffect, useState } from "react";
import { messageFromApiBody } from "@/lib/utils/api-error";
import { formatCompactUsd, formatPct, pctClass } from "@/lib/utils/format";
import type { MarketOverview } from "@/types/market";

export function MarketStrip() {
  const [data, setData] = useState<MarketOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/market")
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(messageFromApiBody(json));
        return json as MarketOverview;
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Erro"));
  }, []);

  if (error) {
    return (
      <p className="text-xs text-amber-400/90 mb-4">
        Mercado indisponível: {error}
      </p>
    );
  }

  if (!data) {
    return (
      <div className="h-10 mb-4 rounded-lg bg-white/5 animate-pulse" aria-hidden />
    );
  }

  return (
    <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
      <Stat label="Market cap" value={formatCompactUsd(data.totalMarketCapUsd)} />
      <Stat label="Volume 24h" value={formatCompactUsd(data.totalVolumeUsd)} />
      <Stat
        label="Dominância BTC"
        value={`${data.btcDominancePct.toFixed(1)}%`}
      />
      <Stat label="Criptos ativas" value={String(data.activeCryptos)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
      <p className="text-zinc-500">{label}</p>
      <p className="font-medium text-zinc-200">{value}</p>
    </div>
  );
}

export function TopCoinsList() {
  const [data, setData] = useState<MarketOverview | null>(null);

  useEffect(() => {
    fetch("/api/market")
      .then(async (r) => {
        if (!r.ok) return null;
        const json = (await r.json()) as MarketOverview;
        return Array.isArray(json.topCoins) ? json : null;
      })
      .then(setData)
      .catch(() => setData(null));
  }, []);

  const topCoins = data?.topCoins;
  if (!topCoins?.length) return null;

  return (
    <ul className="space-y-1 text-xs text-zinc-400">
      {topCoins.slice(0, 5).map((c) => (
        <li key={c.id} className="flex justify-between gap-2">
          <span className="text-zinc-300 uppercase">{c.symbol}</span>
          <span className={pctClass(c.change24hPct)}>
            {formatPct(c.change24hPct)}
          </span>
        </li>
      ))}
    </ul>
  );
}
