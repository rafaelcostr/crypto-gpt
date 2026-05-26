export type PortfolioHolding = {
  id: string;
  coinId: string;
  symbol: string;
  name: string;
  amount: number;
};

export type PortfolioSnapshot = {
  holdings: PortfolioHolding[];
  totalUsd: number;
  totalBrl: number;
  lines: Array<{
    holding: PortfolioHolding;
    priceUsd: number;
    valueUsd: number;
    change24hPct: number | null;
  }>;
};
