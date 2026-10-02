import { createHmac, timingSafeEqual, createHash } from "node:crypto";
import { z } from "zod";
import { db } from "./db";
import { requireValue, HttpError } from "./validation";
import { type OrderRow, audit, enqueue, release } from "./commerce";
const endpoint = "https://app.papi.mg/engine/api/payment-links";
const providers: Record<string, string> = {
  MVola: "MVOLA",
  "Orange Money": "ORANGE_MONEY",
  "Airtel Money": "AIRTEL_MONEY",
  "Carte bancaire": "BRED",
};
export function verifySignature(
  raw: string,
  header: string | null,
  secret: string,
  now = Date.now(),
) {
  const match = header?.match(/^t=(\d+),v1=([a-f0-9]{64})$/);
  if (!match || Math.abs(now / 1000 - Number(match[1])) > 300) return false;
  const digest = createHmac("sha256", secret)
    .update(match[1] + "." + raw)
    .digest();
  return timingSafeEqual(digest, Buffer.from(match[2], "hex"));
}
async function papi(path: string, body?: unknown) {
  requireValue(process.env.PAPI_API_KEY, 503, "Paiement non configuré.");
  const r = await fetch(endpoint + path, {
    method: body ? "POST" : "GET",
    headers: {
      Token: process.env.PAPI_API_KEY,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(12000),
    cache: "no-store",
  });
  if (r.status === 404 && !body) return null;
  if (!r.ok)
    throw new HttpError(
      502,
      "Papi est indisponible. Votre commande est conservée ; réessayez depuis votre compte.",
    );
  const json = await r.json();
  return json.data;
}
const paymentData = z.object({
  amount: z.number(),
  currency: z.literal("MGA"),
  notificationToken: z.string(),
  paymentLink: z.string().url(),
  linkExpirationDateTime: z.number(),
  isTestMode: z.boolean(),
});
export async function paymentLink(id: string) {
  // Keep a durable started marker before the external call. An ambiguous timeout
  // is recovered with GET only: never issue a second charge link blindly.
  const row = await db().transaction(async (tx) => {
    const row = (
      await tx.query<OrderRow>("SELECT * FROM orders WHERE id=$1 FOR UPDATE", [
        id,
      ])
    ).rows[0];
    requireValue(
      row && row.payment_status !== "paid" && !row.released,
      409,
      "Cette commande ne peut plus être payée.",
    );
    if (row.payment_link) return { ...row, create: false };
    if (row.payment_started) return { ...row, create: false };
    await tx.query("UPDATE orders SET payment_started=true WHERE id=$1", [id]);
    return { ...row, create: true };
  });
  if (row.payment_link) {
    requireValue(
      !row.link_expires_at || Date.parse(row.link_expires_at) > Date.now(),
      409,
      "Le lien a expiré. Actualisez le statut de la commande.",
    );
    return row.payment_link;
  }
  const base = process.env.APP_URL;
  requireValue(base, 503, "Adresse publique manquante.");
  let result;
  if (row.create) {
    result = await papi("", {
      amount: row.data.total,
      currency: "MGA",
      displayCurrency: "MGA",
      reference: id,
      clientName: row.data.customer,
      description: "Commande " + id,
      successUrl: base + "/confirmation/" + id,
      failureUrl: base + "/confirmation/" + id,
      notificationUrl: base + "/api/papi/notification",
      validDuration: 1,
      provider: providers[row.data.method],
      payerEmail: row.data.email,
      payerPhone: row.data.phone,
      isTestMode: process.env.PAPI_TEST_MODE !== "false",
    });
  } else {
    result = await papi("/" + encodeURIComponent(id));
    requireValue(
      result,
      503,
      "Création du paiement à vérifier. Aucun nouveau débit ne sera lancé automatiquement.",
    );
  }
  const parsed = paymentData.parse(result);
  requireValue(
    parsed.amount === row.data.total,
    502,
    "Montant Papi incohérent.",
  );
  const url = new URL(parsed.paymentLink);
  requireValue(
    url.protocol === "https:" && url.hostname === "payment-form.papi.mg",
    502,
    "Adresse de paiement invalide.",
  );
  await db().query(
    "UPDATE orders SET payment_link=$2,notification_token=$3,link_expires_at=$4 WHERE id=$1",
    [
      id,
      parsed.paymentLink,
      parsed.notificationToken,
      new Date(parsed.linkExpirationDateTime).toISOString(),
    ],
  );
  if (!row.create) {
    await reconcile(id);
    const latest = (
      await db().query<OrderRow>("SELECT * FROM orders WHERE id=$1", [id])
    ).rows[0];
    requireValue(
      latest.payment_status === "pending" || latest.payment_status === "failed",
      409,
      "Le statut du paiement a changé. Actualisez votre commande.",
    );
  }
  return parsed.paymentLink;
}
const eventSchema = z.object({
  merchantPaymentReference: z.string(),
  notificationToken: z.string(),
  amount: z.number(),
  currency: z.literal("MGA"),
  paymentStatus: z.enum(["SUCCESS", "PENDING", "FAILED"]).nullable(),
  linkStatus: z.enum(["ACTIVE", "EXPIRED", "PAID", "DISABLED"]).optional(),
  isTestMode: z.boolean().optional(),
});
export async function applyPayment(input: unknown, eventKey: string) {
  const event = eventSchema.parse(input);
  await db().transaction(async (tx) => {
    const row = (
      await tx.query<OrderRow>("SELECT * FROM orders WHERE id=$1 FOR UPDATE", [
        event.merchantPaymentReference,
      ])
    ).rows[0];
    requireValue(row, 404, "Référence inconnue.");
    requireValue(
      row.notification_token &&
        row.notification_token === event.notificationToken &&
        row.data.total === event.amount,
      409,
      "Notification incohérente.",
    );
    const already = (
      await tx.query(
        "SELECT event_key FROM payment_events WHERE event_key=$1",
        [eventKey],
      )
    ).rows.length;
    if (already) return;
    await tx.query(
      "INSERT INTO payment_events(event_key,order_id) VALUES($1,$2)",
      [eventKey, row.id],
    );
    if (row.payment_status === "paid" || row.payment_status === "refunded")
      return;
    if (event.paymentStatus === "SUCCESS") {
      const status = row.released ? "review" : "paid";
      row.data.status = row.released ? "Paiement à vérifier" : "Confirmée";
      await tx.query(
        "UPDATE orders SET payment_status=$2,data=$3 WHERE id=$1",
        [row.id, status, JSON.stringify(row.data)],
      );
      await enqueue(
        tx,
        row.id + ":" + status,
        row.data.email,
        "Paiement de votre commande",
        row.released
          ? "Paiement reçu après libération du stock. Notre équipe doit vérifier votre commande."
          : "Paiement confirmé pour " + row.id + ". Merci pour votre achat.",
      );
      await audit(tx, "papi", "payment." + status, row.id);
    } else if (
      event.linkStatus === "EXPIRED" ||
      event.linkStatus === "DISABLED"
    ) {
      // In-flight attempts retain stock until a terminal result is known.
      if (event.paymentStatus === "PENDING") return;
      await release(tx, row);
      row.data.status = "Annulée";
      await tx.query(
        "UPDATE orders SET payment_status='expired',data=$2 WHERE id=$1",
        [row.id, JSON.stringify(row.data)],
      );
      await audit(tx, "papi", "payment.expired", row.id);
    } else if (event.paymentStatus === "FAILED")
      await tx.query("UPDATE orders SET payment_status='failed' WHERE id=$1", [
        row.id,
      ]);
  });
}
export async function reconcile(id: string) {
  const result = await papi("/" + encodeURIComponent(id));
  if (!result) return;
  await applyPayment(
    result,
    createHash("sha256").update(JSON.stringify(result)).digest("hex"),
  );
}
