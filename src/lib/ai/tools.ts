import type Groq from "groq-sdk";
import {
  getCoinPrice,
  getMarketOverview,
  searchCoins,
} from "@/lib/integrations/coingecko";
import { fetchCryptoNews, formatNewsForPrompt } from "@/lib/integrations/news";

export const CRYPTO_TOOLS: Groq.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_coin_price",
      description:
        "Preço atual em USD/BRL e variação 24h de uma cripto (id CoinGecko ou símbolo, ex: bitcoin, btc, ethereum).",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Id ou símbolo da moeda" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_coins",
      description: "Busca criptomoedas por nome ou símbolo.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Termo de busca" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_market_overview",
      description:
        "Panorama do mercado: market cap total, volume, dominância BTC e top 8 moedas.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_crypto_news",
      description: "Últimas manchetes de cripto (RSS) para resumir ao usuário.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Quantidade de notícias (1-10, padrão 6)",
          },
        },
      },
    },
  },
];

export async function runTool(
  name: string,
  argsJson: string,
): Promise<string> {
  let args: Record<string, unknown> = {};
  try {
    args = argsJson ? (JSON.parse(argsJson) as Record<string, unknown>) : {};
  } catch {
    return JSON.stringify({ error: "Argumentos inválidos" });
  }

  switch (name) {
    case "get_coin_price": {
      const query = String(args.query ?? "");
      const price = await getCoinPrice(query);
      if (!price) {
        return JSON.stringify({ error: `Moeda não encontrada: ${query}` });
      }
      return JSON.stringify(price);
    }
    case "search_coins": {
      const query = String(args.query ?? "");
      const coins = await searchCoins(query);
      return JSON.stringify({ coins });
    }
    case "get_market_overview": {
      const overview = await getMarketOverview();
      return JSON.stringify(overview);
    }
    case "get_crypto_news": {
      const limit = Math.min(10, Math.max(1, Number(args.limit) || 6));
      const items = await fetchCryptoNews();
      return JSON.stringify({
        headlines: formatNewsForPrompt(items, limit),
        items: items.slice(0, limit),
      });
    }
    default:
      return JSON.stringify({ error: `Tool desconhecida: ${name}` });
  }
}
