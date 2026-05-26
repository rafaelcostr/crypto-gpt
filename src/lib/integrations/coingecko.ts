import { getServerEnv } from "@/config/env";
import type { CoinPrice, CoinSearchResult, MarketOverview } from "@/types/market";

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { at: number; data: unknown }>();

function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return Promise.resolve(hit.data as T);
  }
  return fetcher().then((data) => {
    cache.set(key, { at: Date.now(), data });
    return data;
  });
}

async function cgFetch<T>(path: string): Promise<T> {
  const base = getServerEnv().COINGECKO_BASE_URL.replace(/\/$/, "");
  const res = await fetch(`${base}${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`CoinGecko ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

type SearchResponse = {
  coins: Array<{
    id: string;
    name: string;
    symbol: string;
    market_cap_rank: number | null;
  }>;
};

export async function searchCoins(query: string): Promise<CoinSearchResult[]> {
  const q = query.trim();
  if (!q) return [];
  return cached(`search:${q.toLowerCase()}`, async () => {
    const data = await cgFetch<SearchResponse>(
      `/search?query=${encodeURIComponent(q)}`,
    );
    return (data.coins ?? []).slice(0, 8).map((c) => ({
      id: c.id,
      name: c.name,
      symbol: c.symbol,
      marketCapRank: c.market_cap_rank,
    }));
  });
}

async function resolveCoinId(query: string): Promise<string | null> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return null;
  const results = await searchCoins(normalized);
  if (!results.length) return null;
  const exact = results.find(
    (r) => r.id === normalized || r.symbol.toLowerCase() === normalized,
  );
  return (exact ?? results[0]).id;
}

type SimplePriceResponse = Record<
  string,
  {
    usd?: number;
    brl?: number;
    usd_24h_change?: number;
    last_updated_at?: number;
  }
>;

export async function getCoinPrice(query: string): Promise<CoinPrice | null> {
  const coinId = await resolveCoinId(query);
  if (!coinId) return null;

  return cached(`price:${coinId}`, async () => {
    const [prices, detail] = await Promise.all([
      cgFetch<SimplePriceResponse>(
        `/simple/price?ids=${coinId}&vs_currencies=usd,brl&include_24hr_change=true&include_last_updated_at=true`,
      ),
      cgFetch<{
        id: string;
        symbol: string;
        name: string;
        market_data?: { market_cap?: { usd?: number } };
      }>(`/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`),
    ]);

    const row = prices[coinId];
    if (!row?.usd) return null;

    return {
      id: detail.id,
      symbol: detail.symbol,
      name: detail.name,
      usd: row.usd,
      brl: row.brl ?? row.usd * 5,
      change24hPct: row.usd_24h_change ?? null,
      marketCapUsd: detail.market_data?.market_cap?.usd ?? null,
      lastUpdated: row.last_updated_at
        ? new Date(row.last_updated_at * 1000).toISOString()
        : new Date().toISOString(),
    };
  });
}

type MarketsRow = {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
};

export async function getMarketOverview(): Promise<MarketOverview> {
  return cached("market:overview", async () => {
    const [global, markets] = await Promise.all([
      cgFetch<{
        data: {
          total_market_cap: { usd: number };
          total_volume: { usd: number };
          market_cap_percentage: { btc: number };
          active_cryptocurrencies: number;
        };
      }>("/global"),
      cgFetch<MarketsRow[]>(
        "/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=8&page=1&sparkline=false",
      ),
    ]);

    const g = global.data;
    return {
      totalMarketCapUsd: g.total_market_cap.usd,
      totalVolumeUsd: g.total_volume.usd,
      btcDominancePct: g.market_cap_percentage.btc,
      activeCryptos: g.active_cryptocurrencies,
      topCoins: markets.map((m) => ({
        id: m.id,
        symbol: m.symbol,
        name: m.name,
        priceUsd: m.current_price,
        change24hPct: m.price_change_percentage_24h,
      })),
    };
  });
}

export async function getPricesForIds(
  ids: string[],
): Promise<Record<string, CoinPrice>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return {};

  const data = await cached(`prices:${unique.sort().join(",")}`, () =>
    cgFetch<SimplePriceResponse>(
      `/simple/price?ids=${unique.join(",")}&vs_currencies=usd,brl&include_24hr_change=true`,
    ),
  );

  const out: Record<string, CoinPrice> = {};
  for (const id of unique) {
    const row = data[id];
    if (!row?.usd) continue;
    out[id] = {
      id,
      symbol: id,
      name: id,
      usd: row.usd,
      brl: row.brl ?? row.usd * 5,
      change24hPct: row.usd_24h_change ?? null,
      marketCapUsd: null,
      lastUpdated: new Date().toISOString(),
    };
  }
  return out;
}
