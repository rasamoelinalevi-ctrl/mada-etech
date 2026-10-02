import { randomUUID, createHash } from "node:crypto";
import { db, type SQL } from "./db";
import { checkoutSchema, settingsSchema, requireValue } from "./validation";
import type { Product, Order, Settings } from "../lib/data";
export type OrderRow = {
  id: string;
  owner_id: string;
  data: Order;
  payment_status: string;
  payment_link: string | null;
  notification_token: string | null;
  link_expires_at: string | null;
  payment_started: boolean;
  released: boolean;
  request_hash: string;
};
export async function catalog(sql: SQL = db(), admin = false) {
  const r = await sql.query<{ data: Product; stock: number; version: number }>(
    "SELECT data,stock,version FROM products ORDER BY id",
  );
  return r.rows
    .map((r) => ({ ...r.data, stock: r.stock, version: r.version }))
    .filter((p) => admin || p.active);
}
export async function settings(sql: SQL = db()) {
  const r = await sql.query<{ data: Settings; version: number }>(
    "SELECT data,version FROM settings WHERE id=1",
  );
  requireValue(r.rows[0], 503, "Boutique en cours de configuration.");
  return { ...r.rows[0].data, version: r.rows[0].version };
}
export async function audit(
  tx: SQL,
  actor: string,
  action: string,
  entity: string,
) {
  await tx.query(
    "INSERT INTO audit_log(id,actor,action,entity) VALUES($1,$2,$3,$4)",
    [randomUUID(), actor, action, entity],
  );
}
export async function enqueue(
  tx: SQL,
  id: string,
  email: string,
  subject: string,
  body: string,
) {
  await tx.query(
    "INSERT INTO outbox(id,recipient,subject,body) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING",
    [id, email, subject, body],
  );
}
export function publicOrder(row: OrderRow): Order {
  return { ...row.data, paymentStatus: row.payment_status };
}
export async function ownedOrder(id: string, owner: string, admin = false) {
  const r = await db().query<OrderRow>(
    "SELECT * FROM orders WHERE id=$1 AND (owner_id=$2 OR $3)",
    [id, owner, admin],
  );
  requireValue(r.rows[0], 404, "Commande introuvable.");
  return r.rows[0];
}
export async function createOrder(owner: string, input: unknown) {
  const data = checkoutSchema.parse(input);
  const quantities = new Map<string, number>();
  for (const item of data.items)
    quantities.set(item.id, (quantities.get(item.id) || 0) + item.quantity);
  const items = [...quantities]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, quantity]) => ({ id, quantity }));
  requireValue(
    items.every((i) => i.quantity <= 1000),
    400,
    "Quantité trop élevée.",
  );
  const requestHash = createHash("sha256")
    .update(JSON.stringify({ ...data, items }))
    .digest("hex");
  return db().transaction(async (tx) => {
    // Serializes retries for one account. Product rows serialize all customers.
    const account = (
      await tx.query<{ email_verified: boolean }>(
        "SELECT email_verified FROM users WHERE id=$1 FOR UPDATE",
        [owner],
      )
    ).rows[0];
    requireValue(
      account?.email_verified,
      403,
      "Confirmez votre adresse e-mail avant de commander.",
    );
    const existing = (
      await tx.query<OrderRow>(
        "SELECT * FROM orders WHERE owner_id=$1 AND idempotency_key=$2",
        [owner, data.idempotencyKey],
      )
    ).rows[0];
    if (existing) {
      requireValue(
        existing.request_hash === requestHash,
        409,
        "Cette demande a déjà été utilisée avec un panier différent.",
      );
      return existing;
    }
    const cfg = settingsSchema.parse(await settings(tx));
    requireValue(
      cfg.commerceReady,
      503,
      "Les commandes ouvriront prochainement.",
    );
    requireValue(
      process.env.PAPI_API_KEY && process.env.PAPI_WEBHOOK_SECRET,
      503,
      "Le paiement est temporairement indisponible.",
    );
    const zone = cfg.zones.find(
      (z) => z.city.toLocaleLowerCase() === data.city.toLocaleLowerCase(),
    );
    requireValue(
      zone,
      400,
      "Cette ville ne figure pas dans nos zones de livraison.",
    );
    const lines: NonNullable<Order["items"]> = [];
    for (const item of items) {
      const row = (
        await tx.query<{ data: Product; stock: number }>(
          "SELECT data,stock FROM products WHERE id=$1 FOR UPDATE",
          [item.id],
        )
      ).rows[0];
      requireValue(
        row?.data.active && row.stock >= item.quantity,
        409,
        "Un produit est indisponible ou son stock est insuffisant.",
      );
      requireValue(
        Number.isSafeInteger(row.data.price) && row.data.price >= 0,
        503,
        "Prix indisponible.",
      );
      lines.push({
        id: item.id,
        sku: row.data.sku || item.id,
        name: row.data.name,
        price: row.data.price,
        quantity: item.quantity,
      });
    }
    const subtotal = lines.reduce((a, i) => a + i.price * i.quantity, 0);
    let discount = 0;
    const code = data.coupon.toUpperCase();
    if (code) {
      const promo = (
        await tx.query<{
          data: {
            active: boolean;
            starts: string;
            ends: string;
            minimum: number;
            limit: number;
            percent: number;
          };
          uses: number;
        }>("SELECT data,uses FROM promotions WHERE code=$1 FOR UPDATE", [code])
      ).rows[0];
      requireValue(
        promo &&
          promo.data.active &&
          Date.parse(promo.data.starts) <= Date.now() &&
          Date.parse(promo.data.ends) > Date.now() &&
          promo.uses < promo.data.limit &&
          subtotal >= promo.data.minimum,
        400,
        "Code promotionnel invalide, expiré ou épuisé.",
      );
      discount = Math.floor((subtotal * promo.data.percent) / 100);
      await tx.query("UPDATE promotions SET uses=uses+1 WHERE code=$1", [code]);
    }
    const shipping = subtotal - discount >= cfg.freeShipping ? 0 : zone.fee;
    const total = subtotal - discount + shipping;
    requireValue(
      Number.isSafeInteger(total) && total >= 300 && total <= 1000000000,
      400,
      "Montant hors limites de paiement.",
    );
    // Prices are tax-inclusive. No tax rate is inferred; merchant configures it.
    const tax = Math.round((total * cfg.taxBps) / (10000 + cfg.taxBps));
    const id = "MT-" + randomUUID();
    const order: Order = {
      id,
      date: new Date().toISOString(),
      customer: data.customer,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: zone.city,
      method: data.method,
      total,
      shipping,
      status: "En attente",
      items: lines,
      discount,
      coupon: code,
      tax,
      taxLabel: cfg.taxLabel,
      currency: "MGA",
      paymentStatus: "pending",
    };
    await tx.query(
      "INSERT INTO orders(id,owner_id,idempotency_key,request_hash,data) VALUES($1,$2,$3,$4,$5)",
      [id, owner, data.idempotencyKey, requestHash, JSON.stringify(order)],
    );
    for (const item of items)
      await tx.query(
        "UPDATE products SET stock=stock-$2,version=version+1 WHERE id=$1",
        [item.id, item.quantity],
      );
    await enqueue(
      tx,
      id + ":created",
      data.email,
      "Commande " + id + " enregistrée",
      "Votre commande est enregistrée. Montant : " +
        total +
        " Ar. Le paiement reste à confirmer. Retrouvez-la dans votre compte.",
    );
    await audit(tx, owner, "order.created", id);
    return (await tx.query<OrderRow>("SELECT * FROM orders WHERE id=$1", [id]))
      .rows[0];
  });
}
export async function release(tx: SQL, row: OrderRow) {
  if (row.released) return;
  for (const line of row.data.items)
    await tx.query(
      "UPDATE products SET stock=stock+$2,version=version+1 WHERE id=$1",
      [line.id, line.quantity],
    );
  if (row.data.coupon)
    await tx.query(
      "UPDATE promotions SET uses=GREATEST(0,uses-1) WHERE code=$1",
      [row.data.coupon],
    );
  await tx.query("UPDATE orders SET released=true WHERE id=$1", [row.id]);
}
export async function changeOrder(
  actor: string,
  id: string,
  status: string,
  tracking: string,
) {
  return db().transaction(async (tx) => {
    const row = (
      await tx.query<OrderRow>("SELECT * FROM orders WHERE id=$1 FOR UPDATE", [
        id,
      ])
    ).rows[0];
    requireValue(row, 404, "Commande introuvable.");
    const transitions: Record<string, string[]> = {
      "En attente": [],
      Confirmée: ["En préparation", "Remboursement à traiter"],
      "En préparation": ["Expédiée", "Remboursement à traiter"],
      Expédiée: ["Livrée", "Retour demandé"],
      Livrée: ["Retour demandé"],
      "Retour demandé": ["Remboursement à traiter"],
      "Remboursement à traiter": [],
    };
    requireValue(
      transitions[row.data.status]?.includes(status),
      409,
      "Transition de commande non autorisée.",
    );
    requireValue(
      row.payment_status === "paid",
      409,
      "Le paiement doit être confirmé.",
    );
    requireValue(
      status !== "Expédiée" || tracking.trim().length >= 3,
      400,
      "Renseignez le suivi avant expédition.",
    );
    row.data = { ...row.data, status, tracking };
    await tx.query("UPDATE orders SET data=$2 WHERE id=$1", [
      id,
      JSON.stringify(row.data),
    ]);
    await audit(tx, actor, "order." + status, id);
    await enqueue(
      tx,
      id + ":" + status,
      row.data.email,
      "Mise à jour de votre commande",
      id + " : " + status + (tracking ? " — Suivi : " + tracking : ""),
    );
  });
}
