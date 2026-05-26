export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
};

export type ChatRequestBody = {
  messages: Array<{ role: ChatRole; content: string }>;
  portfolioContext?: string;
};

export type ChatResponseBody = {
  message: ChatMessage;
  toolsUsed?: string[];
};
