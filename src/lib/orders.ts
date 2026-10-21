import { supabase } from "./supabase";
import type { OrderView } from "./types";

export async function fetchOrder(
  orderId: string,
  table: number,
  token: string
): Promise<OrderView | null> {
  if (!Number.isInteger(table) || !token || !/^[0-9a-f-]{36}$/i.test(orderId)) {
    return null;
  }

  const { data: tbl } = await supabase
    .from("cafe_tables")
    .select("number")
    .eq("number", table)
    .eq("token", token)
    .maybeSingle();
  if (!tbl) return null;

  const { data } = await supabase
    .from("orders")
    .select(
      "id, order_no, status, total, created_at, order_items(name, quantity, unit_price, customizations, note)"
    )
    .eq("id", orderId)
    .eq("table_number", table)
    .maybeSingle();
  if (!data) return null;

  const { count } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("order_id", orderId);

  return {
    ...(data as unknown as Omit<OrderView, "reviewed">),
    reviewed: (count ?? 0) > 0,
  };
}