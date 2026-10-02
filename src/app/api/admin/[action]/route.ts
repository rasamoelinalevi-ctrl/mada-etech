import { requireUser } from "@/server/auth";
import { body, origin, respond, failure } from "@/server/http";
import {
  productSchema,
  settingsSchema,
  promotionSchema,
  requireValue,
  text,
} from "@/server/validation";
import { db } from "@/server/db";
import { audit, changeOrder } from "@/server/commerce";
import { z } from "zod";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    origin(req);
    const u = await requireUser(true);
    const { action } = await params;
    const input = await body(req);
    if (action === "product") {
      const p = productSchema.parse(input);
      let media: { id: string; bytes: Buffer } | undefined;
      if (p.image.startsWith("data:")) {
        const bytes = await sharp(
          Buffer.from(p.image.split(",")[1], "base64"),
          { limitInputPixels: 16000000 },
        )
          .rotate()
          .resize({
            width: 1200,
            height: 1200,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 85 })
          .toBuffer();
        media = { id: "upload-" + randomUUID() + ".webp", bytes };
        p.image = "/images/" + media.id;
      }
      await db().transaction(async (tx) => {
        if (media)
          await tx.query("INSERT INTO media(id,bytes) VALUES($1,$2)", [
            media.id,
            media.bytes,
          ]);
        const existing = (
          await tx.query<{ version: number }>(
            "SELECT version FROM products WHERE id=$1 FOR UPDATE",
            [p.id],
          )
        ).rows[0];
        if (existing) {
          requireValue(
            existing.version === p.version,
            409,
            "Ce produit a changé. Rechargez avant de modifier.",
          );
          await tx.query(
            "UPDATE products SET sku=$2,data=$3,stock=$4,version=version+1 WHERE id=$1",
            [p.id, p.sku, JSON.stringify(p), p.stock],
          );
        } else {
          requireValue(p.version === undefined, 409, "Produit supprimé.");
          await tx.query(
            "INSERT INTO products(id,sku,data,stock) VALUES($1,$2,$3,$4)",
            [p.id, p.sku, JSON.stringify(p), p.stock],
          );
        }
        await audit(tx, u.id, "product.saved", p.id);
      });
    } else if (action === "settings") {
      const s = settingsSchema.parse(input);
      requireValue(
        !s.commerceReady ||
          (s.legalText.length >= 100 &&
            s.returnsText.length >= 50 &&
            !s.email.endsWith(".example")),
        400,
        "Complétez les coordonnées, conditions et retours avant ouverture.",
      );
      await db().transaction(async (tx) => {
        const r = await tx.query(
          "UPDATE settings SET data=$1,version=version+1 WHERE id=1 AND version=$2 RETURNING id",
          [JSON.stringify(s), s.version],
        );
        requireValue(
          r.rows.length,
          409,
          "Paramètres modifiés ailleurs. Rechargez.",
        );
        await audit(tx, u.id, "settings.saved", "store");
      });
    } else if (action === "order") {
      const p = z
        .object({
          id: text(),
          status: text(),
          tracking: text(0, 300).default(""),
        })
        .strict()
        .parse(input);
      await changeOrder(u.id, p.id, p.status, p.tracking);
    } else if (action === "promotion") {
      const p = promotionSchema.parse(input);
      await db().transaction(async (tx) => {
        await tx.query(
          "INSERT INTO promotions(code,data) VALUES($1,$2) ON CONFLICT(code) DO UPDATE SET data=EXCLUDED.data",
          [p.code, JSON.stringify(p)],
        );
        await audit(tx, u.id, "promotion.saved", p.code);
      });
    } else requireValue(false, 404, "Action inconnue.");
    return respond({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
export async function GET(
  req: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    await requireUser(true);
    const { action } = await params;
    requireValue(
      ["promotions", "audit", "emails"].includes(action),
      404,
      "Action inconnue.",
    );
    const queries: Record<string, string> = {
      promotions: "SELECT data,uses FROM promotions ORDER BY code",
      audit: "SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 200",
      emails:
        "SELECT id,attempts,sent_at,available_at FROM outbox ORDER BY available_at DESC LIMIT 200",
    };
    return respond((await db().query(queries[action])).rows);
  } catch (e) {
    return failure(e);
  }
}
