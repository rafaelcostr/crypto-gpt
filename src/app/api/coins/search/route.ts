import { searchCoins } from "@/lib/integrations/coingecko";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (!q.trim()) {
    return Response.json({ coins: [] });
  }
  try {
    const coins = await searchCoins(q);
    return Response.json({ coins });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro na busca";
    return Response.json({ error: message }, { status: 502 });
  }
}
