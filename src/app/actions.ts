"use server";

import { supabase } from "@/lib/supabase";
import { fetchOrder } from "@/lib/orders";
import type { OrderView } from "@/lib/types";

type LineInput = {
  kind: "item" | "combo";
  id: string;
  quantity: number;
  removes: string[];
  addons: string[];
  note?: string;
};

type Opt = { id: string; name: string; kind: string; price: number };
type ItemRow = {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
  is_special: boolean;
  special_price: number | null;
  customization_options: Opt[];
};
type ComboRow = { id: string; name: string; price: number };

type Result =
  | { ok: true; orderNo: number; orderId: string; total: number }
  | { ok: false; error: string };

const NONE = "00000000-0000-0000-0000-000000000000";

export async function placeOrder(input: {
  table: number;
  token: string;
  lines: LineInput[];
  note?: string;
}): Promise<Result> {
  const { table, token, lines } = input;

  if (!Array.isArray(lines) || lines.length === 0 || lines.length > 30) {
    return { ok: false, error: "Your cart is empty." };
  }

  const { data: tbl } = await supabase
    .from("cafe_tables")
    .select("number")
    .eq("number", table)
    .eq("token", token)
    .maybeSingle();
  if (!tbl) {
    return { ok: false, error: "Invalid table. Please scan the QR code again." };
  }

  const { data: setting } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "ordering_open")
    .maybeSingle();
  if (setting?.value === false) {
    return { ok: false, error: "Sorry, ordering is currently closed." };
  }

  const { count: pending } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("table_number", table)
    .eq("status", "new");
  if ((pending ?? 0) >= 5) {
    return {
      ok: false,
      error: "Please wait a moment, our staff is confirming your earlier orders.",
    };
  }

  const itemIds = lines.filter((l) => l.kind === "item").map((l) => String(l.id));
  const comboIds = lines.filter((l) => l.kind === "combo").map((l) => String(l.id));

  const [itemsRes, combosRes] = await Promise.all([
    supabase
      .from("menu_items")
      .select("*, customization_options(*)")
      .in("id", itemIds.length ? itemIds : [NONE]),
    supabase
      .from("combos")
      .select("id, name, price")
      .eq("is_active", true)
      .in("id", comboIds.length ? comboIds : [NONE]),
  ]);
  const items = (itemsRes.data ?? []) as unknown as ItemRow[];
  const combos = (combosRes.data ?? []) as unknown as ComboRow[];

  let total = 0;
  const rows: {
    name: string;
    unit_price: number;
    quantity: number;
    customizations: { name: string; kind: string; price: number }[];
    note: string | null;
  }[] = [];

  for (const l of lines) {
    const qty = Math.floor(Number(l.quantity));
    if (!(qty >= 1 && qty <= 20)) {
      return { ok: false, error: "Invalid quantity in your cart." };
    }
    const note = l.note ? String(l.note).slice(0, 200) : null;

    if (l.kind === "combo") {
      const c = combos.find((x) => x.id === l.id);
      if (!c) {
        return { ok: false, error: "A combo in your cart is no longer available." };
      }
      const unit = Number(c.price);
      total += unit * qty;
      rows.push({ name: c.name, unit_price: unit, quantity: qty, customizations: [], note });
      continue;
    }

    const it = items.find((x) => x.id === l.id);
    if (!it || !it.is_available) {
      return {
        ok: false,
        error: `${it?.name ?? "An item"} is not available right now.`,
      };
    }
    const chosenIds = [
      ...(Array.isArray(l.removes) ? l.removes : []),
      ...(Array.isArray(l.addons) ? l.addons : []),
    ];
    const picked = chosenIds
      .map((oid) => it.customization_options.find((o) => o.id === oid))
      .filter((o): o is Opt => Boolean(o));
    const base =
      it.is_special && it.special_price != null
        ? Number(it.special_price)
        : Number(it.price);
    const unit = base + picked.reduce((s, o) => s + Number(o.price), 0);
    total += unit * qty;
    rows.push({
      name: it.name,
      unit_price: unit,
      quantity: qty,
      customizations: picked.map((o) => ({
        name: o.name,
        kind: o.kind,
        price: Number(o.price),
      })),
      note,
    });
  }

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      table_number: table,
      total,
      payment_method: "counter",
      note: input.note ? String(input.note).slice(0, 300) : null,
    })
    .select("id, order_no")
    .single();

  if (error || !order) {
    return { ok: false, error: "Could not place your order. Please try again." };
  }

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(rows.map((r) => ({ ...r, order_id: order.id })));

  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return { ok: false, error: "Could not place your order. Please try again." };
  }

  return { ok: true, orderNo: Number(order.order_no), orderId: order.id, total };
}

export async function getOrderStatus(input: {
  orderId: string;
  table: number;
  token: string;
}): Promise<OrderView | null> {
  return fetchOrder(input.orderId, input.table, input.token);
}

export async function submitReview(input: {
  orderId: string;
  table: number;
  token: string;
  rating: number;
  comment?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const order = await fetchOrder(input.orderId, input.table, input.token);
  if (!order) return { ok: false, error: "Order not found." };
  if (order.status !== "served") {
    return { ok: false, error: "You can review once your order is served." };
  }
  if (order.reviewed) {
    return { ok: false, error: "Thanks, you've already reviewed this order." };
  }

  const rating = Math.floor(Number(input.rating));
  if (!(rating >= 1 && rating <= 5)) {
    return { ok: false, error: "Please choose a star rating." };
  }

  const { error } = await supabase.from("reviews").insert({
    order_id: input.orderId,
    table_number: input.table,
    rating,
    comment: input.comment ? String(input.comment).slice(0, 500) : null,
  });
  if (error) {
    return { ok: false, error: "Could not save your review. Please try again." };
  }
  return { ok: true };
}