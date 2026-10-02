import { requireUser } from "@/server/auth";
import { createOrder } from "@/server/commerce";
import { body, origin, rate, respond, failure } from "@/server/http";
export async function POST(req: Request) {
  try {
    origin(req);
    const u = await requireUser();
    await rate("checkout:" + u.id, 20, 3600);
    const order = await createOrder(u.id, await body(req));
    return respond({ id: order.id });
  } catch (e) {
    return failure(e);
  }
}
