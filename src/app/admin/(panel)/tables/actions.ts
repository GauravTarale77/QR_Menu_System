"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

export async function regenerateToken(table: number) {
  await requireAdmin();
  if (!Number.isInteger(table)) return;
  const token = randomBytes(6).toString("hex");
  await supabase.from("cafe_tables").update({ token }).eq("number", table);
  revalidatePath("/admin/tables");
}