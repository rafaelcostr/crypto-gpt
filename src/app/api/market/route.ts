import { getMarketOverview } from "@/lib/integrations/coingecko";
import { messageFromUnknown } from "@/lib/utils/api-error";

export async function GET() {
  try {
    const overview = await getMarketOverview();
    return Response.json(overview);
  } catch (err) {
    const message = messageFromUnknown(err, "Erro ao buscar mercado");
    return Response.json({ error: message }, { status: 502 });
  }
}
