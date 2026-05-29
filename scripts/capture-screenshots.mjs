/**
 * Gera prints para o README (docs/images/).
 * Uso: npm run dev (outro terminal) && node scripts/capture-screenshots.mjs
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "docs", "images");
const base = process.env.SCREENSHOT_BASE ?? "http://localhost:3000";

const demoChat = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Olá! Sou o CryptoGPT. Pergunte sobre preços, mercado, notícias ou sua carteira (aba Portfólio). Uso dados reais do CoinGecko e do RSS — não invento cotações.",
    createdAt: "2026-05-22T12:00:00.000Z",
  },
  {
    id: "u1",
    role: "user",
    content: "Qual é o preço do Bitcoin agora?",
    createdAt: "2026-05-22T12:01:00.000Z",
  },
  {
    id: "a1",
    role: "assistant",
    content:
      "Bitcoin (BTC) está em cerca de *US$ 67.200* e *R$ 385.400*, com variação de *+1,2%* nas últimas 24h (dados CoinGecko).\n\nNão é recomendação de compra ou venda — apenas informação de mercado.",
    createdAt: "2026-05-22T12:01:05.000Z",
  },
];

const demoPortfolio = [
  {
    id: "h1",
    coinId: "bitcoin",
    symbol: "btc",
    name: "Bitcoin",
    amount: 0.05,
  },
  {
    id: "h2",
    coinId: "ethereum",
    symbol: "eth",
    name: "Ethereum",
    amount: 1.2,
  },
];

const shots = [
  {
    file: "demo-01-chat.png",
    path: "/",
    setup: async (page) => {
      await page.evaluate((messages) => {
        localStorage.setItem("cryptogpt_chat_v1", JSON.stringify(messages));
      }, demoChat);
      await page.reload({ waitUntil: "networkidle" });
    },
  },
  {
    file: "demo-02-portfolio.png",
    path: "/portfolio",
    setup: async (page) => {
      await page.evaluate((holdings) => {
        localStorage.setItem("cryptogpt_portfolio_v1", JSON.stringify(holdings));
      }, demoPortfolio);
      await page.reload({ waitUntil: "networkidle" });
    },
  },
  { file: "demo-03-news.png", path: "/news" },
  { file: "demo-04-alerts.png", path: "/alerts" },
];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  colorScheme: "dark",
});

for (const shot of shots) {
  const page = await context.newPage();
  const url = `${base}${shot.path}`;
  console.log(`→ ${shot.file} (${url})`);
  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  if (shot.setup) await shot.setup(page);
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: path.join(outDir, shot.file),
    fullPage: false,
  });
  await page.close();
}

await browser.close();
console.log(`\n✓ Prints salvos em docs/images/`);
