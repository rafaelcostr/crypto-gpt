export type CoinPrice = {
  id: string;
  symbol: string;
  name: string;
  usd: number;
  brl: number;
  change24hPct: number | null;
  marketCapUsd: number | null;
  lastUpdated: string;
};

export type CoinSearchResult = {
  id: string;
  name: string;
  symbol: string;
  marketCapRank: number | null;
};

export type MarketOverview = {
  totalMarketCapUsd: number;
  totalVolumeUsd: number;
  btcDominancePct: number;
  activeCryptos: number;
  topCoins: Array<{
    id: string;
    symbol: string;
    name: string;
    priceUsd: number;
    change24hPct: number;
  }>;
};

export type NewsItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
};
