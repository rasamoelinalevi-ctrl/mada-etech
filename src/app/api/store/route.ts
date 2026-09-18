import {
  catalog,
  settings,
  publicOrder,
  type OrderRow,
} from "@/server/commerce";
import { user } from "@/server/auth";
import { db } from "@/server/db";
import { respond, failure } from "@/server/http";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const u = await user();
    const admin = u?.role === "admin";
    const cfg = await settings();
    return respond({
      products: await catalog(db(), admin),
      settings: cfg,
      profile: { name: u?.name || "", email: u?.email || "" },
      authenticated: !!u,
      admin,
      orders: u
        ? (
            await db().query<OrderRow>(
              "SELECT * FROM orders WHERE owner_id=$1 OR $2 ORDER BY created_at DESC LIMIT 200",
              [u.id, admin],
            )
          ).rows.map(publicOrder)
        : [],
      messages: admin
        ? (
            await db().query<{ data: unknown }>(
              "SELECT data FROM messages ORDER BY created_at DESC LIMIT 200",
            )
          ).rows.map((r) => r.data)
        : [],
      paymentConfigured: !!(
        process.env.PAPI_API_KEY && process.env.PAPI_WEBHOOK_SECRET
      ),
      mastercardEnabled: process.env.PAPI_MASTERCARD_ENABLED === "true",
    });
  } catch (e) {
    return failure(e);
  }
}
