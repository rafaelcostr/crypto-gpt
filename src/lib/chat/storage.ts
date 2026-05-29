import type { ChatMessage } from "@/types/chat";

export const CHAT_STORAGE_KEY = "cryptogpt_chat_v1";
const MAX_STORED_MESSAGES = 50;

export const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Olá! Sou o CryptoGPT. Pergunte sobre preços, mercado, notícias ou sua carteira (aba Portfólio). Uso dados reais do CoinGecko e do RSS — não invento cotações.",
  createdAt: new Date().toISOString(),
};

function isValidMessage(m: unknown): m is ChatMessage {
  if (!m || typeof m !== "object") return false;
  const msg = m as ChatMessage;
  return (
    typeof msg.id === "string" &&
    (msg.role === "user" || msg.role === "assistant") &&
    typeof msg.content === "string" &&
    typeof msg.createdAt === "string"
  );
}

export function loadChatMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [WELCOME_MESSAGE];
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [WELCOME_MESSAGE];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [WELCOME_MESSAGE];
    const valid = parsed.filter(isValidMessage);
    if (!valid.length) return [WELCOME_MESSAGE];
    return valid.slice(-MAX_STORED_MESSAGES);
  } catch {
    return [WELCOME_MESSAGE];
  }
}

export function saveChatMessages(messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  const toStore = messages.slice(-MAX_STORED_MESSAGES);
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toStore));
}

export function clearChatMessages(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CHAT_STORAGE_KEY);
}

export function messagesForApi(messages: ChatMessage[]): Array<{
  role: ChatMessage["role"];
  content: string;
}> {
  return messages
    .filter((m) => m.id !== "welcome")
    .map((m) => ({ role: m.role, content: m.content }));
}
