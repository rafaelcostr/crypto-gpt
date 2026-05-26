import type { PortfolioHolding } from "@/types/portfolio";

export const PORTFOLIO_STORAGE_KEY = "cryptogpt_portfolio_v1";

export function loadHoldings(): PortfolioHolding[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PortfolioHolding[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHoldings(holdings: PortfolioHolding[]): void {
  localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(holdings));
}

export function formatPortfolioContext(
  holdings: PortfolioHolding[],
  prices: Record<string, { usd: number; change24hPct: number | null }>,
): string {
  if (!holdings.length) return "Carteira vazia.";
  return holdings
    .map((h) => {
      const p = prices[h.coinId];
      const usd = p ? h.amount * p.usd : null;
      const line = usd
        ? `${h.amount} ${h.symbol.toUpperCase()} ≈ $${usd.toFixed(2)}`
        : `${h.amount} ${h.symbol.toUpperCase()} (preço indisponível)`;
      const ch =
        p?.change24hPct != null
          ? `, 24h: ${p.change24hPct.toFixed(2)}%`
          : "";
      return `- ${h.name}: ${line}${ch}`;
    })
    .join("\n");
}
