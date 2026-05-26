# Arquitetura — CryptoGPT

## Visão geral

Aplicação **Next.js (App Router)** com UI em React e API em Route Handlers. A IA (Groq) usa **function calling** para buscar dados reais antes de responder — evita alucinar preços.

```
src/
├── app/                    # Rotas e páginas
│   ├── api/                # BFF: chat, mercado, moedas, notícias
│   ├── portfolio/
│   ├── news/
│   └── alerts/
├── components/             # UI por domínio (chat, portfolio, …)
├── config/                 # Env validado (Zod)
├── lib/
│   ├── ai/                 # Prompt, tools, agent loop
│   ├── integrations/       # CoinGecko, RSS
│   └── portfolio/          # Helpers localStorage (client)
└── types/                  # Contratos compartilhados
```

## Fluxo do chat

1. Cliente envia histórico + contexto opcional da carteira.
2. `runCryptoAgent` chama Groq com `tools` definidas em `lib/ai/tools.ts`.
3. Se o modelo pede tools, o servidor executa (`get_coin_price`, etc.) e devolve JSON.
4. Loop até resposta em texto (máx. 6 rodadas).
5. Resposta final ao cliente.

## Integrações

| Fonte | Uso | Cache |
|-------|-----|-------|
| CoinGecko | Preços, busca, overview | 60s em memória (server) |
| CoinDesk RSS | Notícias | 5 min |
| Groq | Chat + resumo de notícias | — |

## Persistência

- **Chat:** `localStorage` (`cryptogpt_chat_v1`, até 50 mensagens por conversa).
- **Portfólio e alertas:** `localStorage` no navegador (demo sem auth).
- **Produção futura:** Supabase/Postgres + auth para histórico entre dispositivos; cron para alertas.

## Manutenção

| Tarefa | Onde |
|--------|------|
| Tom / regras da IA | `src/lib/ai/prompts.ts` |
| Nova ferramenta | `src/lib/ai/tools.ts` + `runTool` |
| Nova API pública | `src/lib/integrations/` + route em `app/api/` |
| Nova página | `src/app/<rota>/page.tsx` + componente |
| Histórico do chat | `src/lib/chat/storage.ts` |

## Deploy

- Vercel: definir `GROQ_API_KEY` nas Environment Variables.
- Rate limit CoinGecko: cache já reduz chamadas; evite spam no chat.

## Disclaimer

Conteúdo educacional/informativo — não é consultoria financeira.
