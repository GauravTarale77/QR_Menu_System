"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

const ALLOWED: Record<string, string[]> = {
  new: ["preparing", "cancelled"],
  preparing: ["served", "cancelled"],
};
const refresh = () => revalidatePath("/admin/orders");

export async function setOrderStatus(
  id: string,
  status: "preparing" | "served" | "cancelled"
) {
  await requireAdmin();
  const { data } = await supabase
    .from("orders")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (!data || !(ALLOWED[data.status] ?? []).includes(status)) return;
  await supabase.from("orders").update({ status }).eq("id", id);
  refresh();
}

export async function markPaid(id: string) {
  await requireAdmin();
  await supabase.from("orders").update({ payment_status: "paid" }).eq("id", id);
  refresh();
}

export async function toggleReserved(table: number, value: boolean) {
  await requireAdmin();
  if (!Number.isInteger(table)) return;
  await supabase.from("cafe_tables").update({ is_reserved: value }).eq("number", table);
  refresh();
}

// Customer left (or reservation cancelled): the table becomes empty again
export async function freeTable(table: number) {
  await requireAdmin();
  if (!Number.isInteger(table)) return;
  await supabase
    .from("cafe_tables")
    .update({ is_reserved: false, cleared_at: new Date().toISOString() })
    .eq("number", table);
  refresh();
}