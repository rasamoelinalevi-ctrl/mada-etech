import {
  randomBytes,
  randomUUID,
  createHash,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";
import { HttpError } from "./validation";
export const hash = (s: string) => createHash("sha256").update(s).digest("hex");
export function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 64).toString("hex");
}
export function passwordMatches(password: string, encoded: string) {
  const [salt, key] = encoded.split(":");
  const actual = scryptSync(password, salt, 64);
  return (
    key?.length === 128 && timingSafeEqual(actual, Buffer.from(key, "hex"))
  );
}
export type User = {
  id: string;
  email: string;
  name: string;
  role: "customer" | "admin";
};
export const cookieName = "mada_session";
export async function user(): Promise<User | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  const r = await db().query<User>(
    "SELECT u.id,u.email,u.name,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()",
    [hash(token)],
  );
  return r.rows[0] || null;
}
export async function requireUser(admin = false) {
  const u = await user();
  if (!u) throw new HttpError(401, "Connectez-vous pour continuer.");
  if (admin && u.role !== "admin") throw new HttpError(403, "Accès refusé.");
  return u;
}
export async function createSession(id: string) {
  const token = randomBytes(32).toString("hex");
  await db().query(
    "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '7 days')",
    [hash(token), id],
  );
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    secure: process.env.APP_URL?.startsWith("https://") ?? false,
    sameSite: "lax",
    path: "/",
    maxAge: 604800,
  });
}
export async function logout() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token)
    await db().query("DELETE FROM sessions WHERE token_hash=$1", [hash(token)]);
  jar.delete(cookieName);
}
export { randomUUID, randomBytes };
