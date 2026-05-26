"use client";

import { useEffect, useState } from "react";
import { formatUsd, newId } from "@/lib/utils/format";

const ALERTS_KEY = "cryptogpt_alerts_v1";

export type PriceAlert = {
  id: string;
  coinId: string;
  symbol: string;
  name: string;
  targetUsd: number;
  direction: "above" | "below";
  triggered?: boolean;
};

function loadAlerts(): PriceAlert[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ALERTS_KEY);
    return raw ? (JSON.parse(raw) as PriceAlert[]) : [];
  } catch {
    return [];
  }
}

function saveAlerts(alerts: PriceAlert[]) {
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
}

export function AlertsManager() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState("");
  const [direction, setDirection] = useState<"above" | "below">("below");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setAlerts(loadAlerts());
  }, []);

  const checkAlerts = async () => {
    const list = loadAlerts().filter((a) => !a.triggered);
    if (!list.length) {
      setStatus("Nenhum alerta ativo.");
      return;
    }
    const ids = [...new Set(list.map((a) => a.coinId))].join(",");
    const res = await fetch(`/api/coins/price?ids=${encodeURIComponent(ids)}`);
    if (!res.ok) {
      setStatus("Erro ao buscar preços.");
      return;
    }
    const json = (await res.json()) as {
      prices: Record<string, { usd: number }>;
    };
    const prices = json.prices ?? {};
    const updated = [...loadAlerts()];
    const fired: string[] = [];

    for (const alert of list) {
      const usd = prices[alert.coinId]?.usd;
      if (usd == null) continue;
      const hit =
        alert.direction === "above"
          ? usd >= alert.targetUsd
          : usd <= alert.targetUsd;
      if (hit) {
        fired.push(
          `${alert.name}: ${formatUsd(usd)} (${alert.direction === "above" ? "≥" : "≤"} ${formatUsd(alert.targetUsd)})`,
        );
        const idx = updated.findIndex((a) => a.id === alert.id);
        if (idx >= 0) updated[idx] = { ...alert, triggered: true };
      }
    }

    saveAlerts(updated);
    setAlerts(updated);
    setStatus(
      fired.length
        ? `Disparados:\n${fired.join("\n")}`
        : "Nenhum alerta disparado agora.",
    );
  };

  const addAlert = async () => {
    const price = parseFloat(target.replace(",", "."));
    if (!price || price <= 0 || query.length < 2) return;

    const res = await fetch(`/api/coins/search?q=${encodeURIComponent(query)}`);
    const json = (await res.json()) as {
      coins: Array<{ id: string; symbol: string; name: string }>;
    };
    const coin = json.coins?.[0];
    if (!coin) {
      setStatus("Moeda não encontrada.");
      return;
    }

    const next: PriceAlert = {
      id: newId(),
      coinId: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      targetUsd: price,
      direction,
    };
    const updated = [...loadAlerts(), next];
    saveAlerts(updated);
    setAlerts(updated);
    setQuery("");
    setTarget("");
    setStatus("Alerta criado.");
  };

  const remove = (id: string) => {
    const updated = loadAlerts().filter((a) => a.id !== id);
    saveAlerts(updated);
    setAlerts(updated);
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl font-semibold">Alertas de preço</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Verificação manual ao clicar em &quot;Verificar agora&quot; (ideal para
          demo; cron em produção).
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0c101c] p-5 space-y-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Moeda (ex: ethereum)"
          className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Preço alvo (USD)"
            className="flex-1 rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm"
          />
          <select
            value={direction}
            onChange={(e) =>
              setDirection(e.target.value as "above" | "below")
            }
            className="rounded-lg bg-black/30 border border-white/10 px-2 text-sm"
          >
            <option value="below">Abaixo de</option>
            <option value="above">Acima de</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => void addAlert()}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-[#06080f] hover:bg-emerald-400"
        >
          Criar alerta
        </button>
        <button
          type="button"
          onClick={() => void checkAlerts()}
          className="ml-2 rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
        >
          Verificar agora
        </button>
      </div>

      {status && (
        <pre className="text-sm text-zinc-400 whitespace-pre-wrap rounded-lg bg-white/5 p-3">
          {status}
        </pre>
      )}

      <ul className="space-y-2">
        {alerts.map((a) => (
          <li
            key={a.id}
            className="flex justify-between items-center rounded-lg border border-white/10 px-3 py-2 text-sm"
          >
            <span>
              {a.name}{" "}
              <span className="text-zinc-500">
                {a.direction === "above" ? "≥" : "≤"} {formatUsd(a.targetUsd)}
              </span>
              {a.triggered && (
                <span className="ml-2 text-emerald-400 text-xs">✓</span>
              )}
            </span>
            <button
              type="button"
              onClick={() => remove(a.id)}
              className="text-xs text-rose-400"
            >
              Remover
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
