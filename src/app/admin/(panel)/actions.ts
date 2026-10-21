"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

export async function runCleanup(): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const { data, error } = await supabase.rpc("cleanup_orders", { keep_days: 30 });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin");
  return {
    ok: true,
    message: `Done. ${data ?? 0} old order(s) removed, daily totals saved.`,
  };
}