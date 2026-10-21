"use server";

import { createHash, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  SESSION_COOKIE,
  SESSION_SECONDS,
  createSession,
} from "@/lib/admin-auth";

const same = (a: string, b: string) =>
  timingSafeEqual(
    createHash("sha256").update(a).digest(),
    createHash("sha256").update(b).digest()
  );

export async function login(
  _prev: { error: string } | undefined,
  formData: FormData
): Promise<{ error: string } | undefined> {
  if (
    !process.env.ADMIN_ID ||
    !process.env.ADMIN_PASSWORD ||
    !process.env.ADMIN_SESSION_SECRET
  ) {
    return { error: "Admin login is not configured on the server." };
  }

  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? "unknown").trim();

  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("login_attempts")
    .select("*", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("created_at", since);
  if ((count ?? 0) >= 5) {
    return { error: "Too many attempts. Please try again in 15 minutes." };
  }

  const id = String(formData.get("id") ?? "");
  const password = String(formData.get("password") ?? "");
  const idOk = same(id, process.env.ADMIN_ID);
  const pwOk = same(password, process.env.ADMIN_PASSWORD);

  if (!(idOk && pwOk)) {
    await supabase.from("login_attempts").insert({ ip });
    await new Promise((r) => setTimeout(r, 800));
    return { error: "Wrong ID or password." };
  }

  await supabase.from("login_attempts").delete().eq("ip", ip);

  (await cookies()).set(SESSION_COOKIE, createSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}