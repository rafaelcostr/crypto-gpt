import { ZodError } from "zod";

export function messageFromUnknown(err: unknown, fallback: string): string {
  if (err instanceof ZodError) {
    return err.issues.map((i) => i.message).join("; ") || fallback;
  }
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return fallback;
}

export function messageFromApiBody(body: { error?: unknown }): string {
  const { error } = body;
  if (typeof error === "string") return error;
  if (Array.isArray(error)) {
    return error
      .map((item) =>
        typeof item === "object" && item && "message" in item
          ? String((item as { message: string }).message)
          : JSON.stringify(item),
      )
      .join("; ");
  }
  if (error instanceof Object) return JSON.stringify(error);
  return "Erro na requisição";
}
