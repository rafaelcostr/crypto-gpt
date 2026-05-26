import type { NewsItem } from "@/types/market";

const RSS_URL = "https://www.coindesk.com/arc/outboundfeeds/rss/";
const CACHE_TTL_MS = 300_000;
let cache: { at: number; items: NewsItem[] } | null = null;

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, "").trim();
}

function parseRssItems(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];

  for (const block of blocks.slice(0, 12)) {
    const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/i);
    const link = block.match(/<link>(.*?)<\/link>/i);
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/i);
    const guid = block.match(/<guid.*?>(.*?)<\/guid>/i);

    const rawTitle = title?.[1] ?? title?.[2];
    const url = link?.[1]?.trim();
    if (!rawTitle || !url) continue;

    const publishedAt = pubDate?.[1]
      ? new Date(pubDate[1]).toISOString()
      : new Date().toISOString();

    items.push({
      id: guid?.[1]?.trim() ?? url,
      title: stripHtml(rawTitle),
      url,
      source: "CoinDesk",
      publishedAt,
    });
  }

  return items;
}

export async function fetchCryptoNews(): Promise<NewsItem[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.items;
  }

  const res = await fetch(RSS_URL, {
    headers: { Accept: "application/rss+xml, application/xml, text/xml" },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`RSS feed unavailable (${res.status})`);
  }

  const xml = await res.text();
  const items = parseRssItems(xml);
  cache = { at: Date.now(), items };
  return items;
}

export function formatNewsForPrompt(items: NewsItem[], limit = 6): string {
  return items
    .slice(0, limit)
    .map(
      (n, i) =>
        `${i + 1}. ${n.title} (${n.source}, ${new Date(n.publishedAt).toLocaleDateString("pt-BR")})`,
    )
    .join("\n");
}
