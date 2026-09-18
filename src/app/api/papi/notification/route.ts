import { createHash } from "node:crypto";
import { verifySignature, applyPayment } from "@/server/papi";
import { limitedText, respond, failure } from "@/server/http";
import { requireValue } from "@/server/validation";
export async function POST(req: Request) {
  try {
    const raw = await limitedText(req, 65536);
    requireValue(
      process.env.PAPI_WEBHOOK_SECRET,
      503,
      "Paiement non configuré.",
    );
    requireValue(
      verifySignature(
        raw,
        req.headers.get("x-papi-signature"),
        process.env.PAPI_WEBHOOK_SECRET,
      ),
      401,
      "Signature invalide.",
    );
    await applyPayment(
      JSON.parse(raw),
      createHash("sha256").update(raw).digest("hex"),
    );
    return respond({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
