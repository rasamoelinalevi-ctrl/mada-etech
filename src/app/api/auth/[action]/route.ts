import { z } from "zod";
import { credentialsSchema, requireValue, text } from "@/server/validation";
import { body, origin, rate, respond, failure } from "@/server/http";
import { db } from "@/server/db";
import {
  passwordHash,
  passwordMatches,
  createSession,
  logout,
  requireUser,
  hash,
  randomUUID,
  randomBytes,
  type User,
} from "@/server/auth";
import { enqueue } from "@/server/commerce";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    origin(req);
    const { action } = await params;
    if (action === "logout") {
      await logout();
      return respond({ ok: true });
    }
    const input = await body(req);
    await rate("auth-global", 300, 60);
    if (action === "verify") {
      const token = z
        .string()
        .regex(/^[a-f0-9]{64}$/)
        .parse(input.token);
      await db().transaction(async (tx) => {
        const row = (
          await tx.query<{ user_id: string }>(
            "DELETE FROM verify_tokens WHERE token_hash=$1 AND expires_at>now() RETURNING user_id",
            [hash(token)],
          )
        ).rows[0];
        requireValue(row, 400, "Lien invalide ou expiré.");
        await tx.query("UPDATE users SET email_verified=true WHERE id=$1", [
          row.user_id,
        ]);
      });
      return respond({ ok: true });
    }
    if (action === "resend") {
      const u = await requireUser();
      await rate("verify:" + u.id, 3, 3600);
      const token = randomBytes(32).toString("hex");
      await db().transaction(async (tx) => {
        await tx.query("DELETE FROM verify_tokens WHERE user_id=$1", [u.id]);
        await tx.query(
          "INSERT INTO verify_tokens(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '24 hours')",
          [hash(token), u.id],
        );
        await enqueue(
          tx,
          "verify:" + randomUUID(),
          u.email,
          "Confirmez votre adresse e-mail",
          "Confirmez votre adresse : " +
            process.env.APP_URL +
            "/connexion?verify=" +
            token,
        );
      });
      return respond({ ok: true });
    }
    if (action === "forgot") {
      const email = z.string().trim().toLowerCase().email().parse(input.email);
      await rate("forgot:" + hash(email), 3, 3600);
      const u = (
        await db().query<User>("SELECT id,email FROM users WHERE email=$1", [
          email,
        ])
      ).rows[0];
      if (u) {
        const token = randomBytes(32).toString("hex");
        await db().transaction(async (tx) => {
          await tx.query("DELETE FROM reset_tokens WHERE user_id=$1", [u.id]);
          await tx.query(
            "INSERT INTO reset_tokens(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '30 minutes')",
            [hash(token), u.id],
          );
          await enqueue(
            tx,
            "reset:" + randomUUID(),
            email,
            "Réinitialisation de votre mot de passe",
            "Ouvrez " +
              process.env.APP_URL +
              "/connexion?token=" +
              token +
              " dans les 30 minutes. Si vous n’avez pas demandé ce changement, ignorez cet e-mail.",
          );
        });
      }
      return respond({
        ok: true,
        message:
          "Si ce compte existe, un e-mail de réinitialisation sera envoyé.",
      });
    }
    if (action === "reset") {
      const { token, password } = z
        .object({
          token: z.string().regex(/^[a-f0-9]{64}$/),
          password: z.string().min(12).max(128),
        })
        .parse(input);
      await rate("reset:" + hash(token), 10);
      await db().transaction(async (tx) => {
        const row = (
          await tx.query<{ user_id: string }>(
            "DELETE FROM reset_tokens WHERE token_hash=$1 AND expires_at>now() RETURNING user_id",
            [hash(token)],
          )
        ).rows[0];
        requireValue(row, 400, "Lien invalide ou expiré.");
        await tx.query("UPDATE users SET password_hash=$2 WHERE id=$1", [
          row.user_id,
          passwordHash(password),
        ]);
        await tx.query("DELETE FROM sessions WHERE user_id=$1", [row.user_id]);
      });
      return respond({ ok: true });
    }
    if (action === "profile") {
      const u = await requireUser();
      const name = text(2, 150).parse(input.name);
      await db().query("UPDATE users SET name=$2 WHERE id=$1", [u.id, name]);
      return respond({ ok: true });
    }
    requireValue(
      action === "register" || action === "login",
      404,
      "Action inconnue.",
    );
    const data = credentialsSchema.parse(input);
    await rate("login:" + hash(data.email), 10);
    if (action === "register") {
      requireValue(data.name, 400, "Nom requis.");
      const id = randomUUID();
      const r = await db().query(
        "INSERT INTO users(id,email,name,password_hash,role) VALUES($1,$2,$3,$4,'customer') ON CONFLICT(email) DO NOTHING RETURNING id",
        [id, data.email, data.name, passwordHash(data.password)],
      );
      requireValue(
        r.rows.length,
        400,
        "Impossible de créer ce compte. Essayez de vous connecter ou de réinitialiser votre mot de passe.",
      );
      await createSession(id);
      return respond({ ok: true });
    }
    const u = (
      await db().query<User & { password_hash: string }>(
        "SELECT * FROM users WHERE email=$1",
        [data.email],
      )
    ).rows[0];
    const fallback = "0123456789abcdef0123456789abcdef:" + "0".repeat(128);
    const valid = passwordMatches(data.password, u?.password_hash || fallback);
    requireValue(u && valid, 401, "Identifiants incorrects.");
    await createSession(u.id);
    return respond({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
