import { ChatPanel } from "@/components/chat/ChatPanel";
import { AppShell } from "@/components/layout/AppShell";
import { MarketStrip, TopCoinsList } from "@/components/market/MarketStrip";

export default function HomePage() {
  return (
    <AppShell activePath="/">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Chat</h1>
        <p className="text-sm text-zinc-500 mt-1">
          IA com dados reais via ferramentas (preço, mercado, notícias).
        </p>
      </div>
      <MarketStrip />
      <div className="grid lg:grid-cols-[1fr_140px] gap-6">
        <ChatPanel />
        <div className="hidden lg:block">
          <p className="text-xs text-zinc-500 uppercase mb-2">Top 24h</p>
          <TopCoinsList />
        </div>
      </div>
    </AppShell>
  );
}
