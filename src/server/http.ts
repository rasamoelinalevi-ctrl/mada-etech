import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "./db";
import { HttpError, requireValue } from "./validation";
export async function body(req: Request) {
  requireValue(
    req.headers.get("content-type")?.includes("application/json"),
    415,
    "JSON requis.",
  );
  const raw = await limitedText(req, 1600000);
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "JSON invalide.");
  }
}
export async function limitedText(req: Request, limit: number) {
  const reader = req.body?.getReader();
  if (!reader) return "";
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      await reader.cancel();
      throw new HttpError(413, "Requête trop volumineuse.");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}
export function origin(req: Request) {
  const configured = process.env.APP_URL;
  requireValue(configured, 503, "Application non configurée.");
  requireValue(
    req.headers.get("origin") === new URL(configured).origin,
    403,
    "Origine refusée.",
  );
}
export async function rate(key: string, limit: number, seconds = 900) {
  const result = await db().query<{ count: number }>(
    "INSERT INTO rate_limits(key,count,expires_at) VALUES($1,1,now()+($2||' seconds')::interval) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limits.expires_at<now() THEN 1 ELSE rate_limits.count+1 END,expires_at=CASE WHEN rate_limits.expires_at<now() THEN EXCLUDED.expires_at ELSE rate_limits.expires_at END RETURNING count",
    [key, String(seconds)],
  );
  requireValue(
    result.rows[0].count <= limit,
    429,
    "Trop de tentatives. Réessayez plus tard.",
  );
}
export function respond(value: unknown, status = 200) {
  return Response.json(value, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
export function failure(error: unknown) {
  const id = randomUUID();
  if (error instanceof z.ZodError)
    return respond(
      {
        error:
          "Données invalides : " +
          error.issues.map((i) => i.path.join(".") + " " + i.message).join(";"),
      },
      400,
    );
  if (error instanceof HttpError)
    return respond({ error: error.message }, error.status);
  console.error(
    JSON.stringify({
      level: "error",
      requestId: id,
      code: (error as { code?: string })?.code || "INTERNAL",
      type: error instanceof Error ? error.name : "unknown",
    }),
  );
  return respond({ error: "Une erreur est survenue. Référence : " + id }, 500);
}
