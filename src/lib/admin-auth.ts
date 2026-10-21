import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "vq_admin";
export const SESSION_SECONDS = 60 * 60 * 12; // stay logged in for 12 hours

const sign = (value: string) =>
  createHmac("sha256", process.env.ADMIN_SESSION_SECRET!)
    .update(value)
    .digest("hex");

export function createSession() {
  const expires = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  return `${expires}.${sign(expires)}`;
}

export async function isAdmin() {
  if (!process.env.ADMIN_SESSION_SECRET) return false;
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return false;

  const [expires, signature] = value.split(".");
  if (!expires || !signature) return false;

  const a = Buffer.from(signature);
  const b = Buffer.from(sign(expires));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  return Number(expires) > Date.now() / 1000;
}

// Call this at the start of every admin action (we'll use it from Step 8 on)
export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}