import { getCoinPrice, getPricesForIds } from "@/lib/integrations/coingecko";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const query = params.get("q");
  const ids = params.get("ids");

  try {
    if (ids) {
      const list = ids.split(",").map((s) => s.trim()).filter(Boolean);
      const prices = await getPricesForIds(list);
      return Response.json({ prices });
    }
    if (query) {
      const price = await getCoinPrice(query);
      if (!price) {
        return Response.json({ error: "Moeda não encontrada" }, { status: 404 });
      }
      return Response.json({ price });
    }
    return Response.json({ error: "Use ?q= ou ?ids=" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao buscar preço";
    return Response.json({ error: message }, { status: 502 });
  }
}
