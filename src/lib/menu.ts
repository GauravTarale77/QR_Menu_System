import { supabase } from "./supabase";
import type { Category, Combo, MenuItem } from "./types";

export async function getTable(number: number, token: string) {
  const { data } = await supabase
    .from("cafe_tables")
    .select("number")
    .eq("number", number)
    .eq("token", token)
    .maybeSingle();
  return data;
}

export async function getMenu() {
  const [cats, items, combos, setting] = await Promise.all([
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("menu_items").select("*, customization_options(*)").order("sort_order"),
    supabase
      .from("combos")
      .select("*, combo_items(quantity, menu_items(name))")
      .eq("is_active", true),
    supabase.from("settings").select("value").eq("key", "ordering_open").maybeSingle(),
  ]);

  return {
    categories: (cats.data ?? []) as Category[],
    items: (items.data ?? []) as MenuItem[],
    combos: (combos.data ?? []) as unknown as Combo[],
    orderingOpen: setting.data?.value !== false,
  };
}