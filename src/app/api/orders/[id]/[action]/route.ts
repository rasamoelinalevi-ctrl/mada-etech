import { requireUser } from "@/server/auth";
import { ownedOrder, publicOrder } from "@/server/commerce";
import { paymentLink, reconcile } from "@/server/papi";
import { origin, rate, respond, failure } from "@/server/http";
import { requireValue } from "@/server/validation";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; action: string }> },
) {
  try {
    origin(req);
    const u = await requireUser();
    const { id, action } = await params;
    await ownedOrder(id, u.id, u.role === "admin");
    await rate("payment:" + u.id, 30, 60);
    if (action === "pay") return respond({ url: await paymentLink(id) });
    requireValue(action === "refresh", 404, "Action inconnue.");
    await reconcile(id);
    return respond({
      order: publicOrder(await ownedOrder(id, u.id, u.role === "admin")),
    });
  } catch (e) {
    return failure(e);
  }
}
