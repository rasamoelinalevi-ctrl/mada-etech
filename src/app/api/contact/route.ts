import { z } from "zod";
import { randomUUID } from "node:crypto";
import { db } from "@/server/db";
import { body, origin, rate, respond, failure } from "@/server/http";
import { text } from "@/server/validation";
import { hash } from "@/server/auth";
export async function POST(req: Request) {
  try {
    origin(req);
    const data = z
      .object({
        name: text(2, 150),
        email: z.string().email().max(254),
        message: text(10, 5000),
      })
      .strict()
      .parse(await body(req));
    await rate("contact-global", 100, 3600);
    await rate("contact:" + hash(data.email), 3, 3600);
    const id = randomUUID();
    await db().query("INSERT INTO messages(id,data) VALUES($1,$2)", [
      id,
      JSON.stringify({ ...data, id, date: new Date().toISOString() }),
    ]);
    return respond({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
