import { getServerEnv, groqKeyFormatOk, hasGroqKey } from "@/config/env";

export async function GET() {
  const env = getServerEnv();
  const configured = hasGroqKey(env);
  const formatOk = groqKeyFormatOk(env);

  return Response.json({
    groqConfigured: configured,
    groqKeyFormatOk: formatOk,
    hint: !configured
      ? "missing"
      : !formatOk
        ? "format"
        : "ok",
  });
}
