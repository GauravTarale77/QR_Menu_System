"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

const BUCKET = "menu-images";
type State = { ok: true } | { ok: false; error: string } | undefined;

const refresh = () => revalidatePath("/admin/menu");

// ---------- categories ----------
export async function saveCategory(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 40);
  const order = Number(formData.get("sort_order"));
  if (!name) return;

  if (id) {
    await supabase
      .from("categories")
      .update({ name, ...(Number.isFinite(order) ? { sort_order: order } : {}) })
      .eq("id", id);
  } else {
    const { count } = await supabase
      .from("categories")
      .select("*", { count: "exact", head: true });
    await supabase.from("categories").insert({ name, sort_order: (count ?? 0) + 1 });
  }
  refresh();
}

export async function deleteCategory(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const { count } = await supabase
    .from("menu_items")
    .select("*", { count: "exact", head: true })
    .eq("category_id", id);
  if ((count ?? 0) > 0) {
    return { error: "This category still has items. Move or delete them first." };
  }
  await supabase.from("categories").delete().eq("id", id);
  refresh();
  return {};
}

// ---------- items ----------
type OptionInput = { name: string; kind: "remove" | "addon"; price: number };

function parseOptions(raw: string): OptionInput[] {
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .slice(0, 20)
      .map((o) => ({
        name: String(o?.name ?? "").trim().slice(0, 40),
        kind: (o?.kind === "addon" ? "addon" : "remove") as "remove" | "addon",
        price: Number(o?.price) || 0,
      }))
      .filter((o) => o.name)
      .map((o) => ({
        ...o,
        price: o.kind === "remove" ? 0 : Math.min(Math.max(o.price, 0), 10000),
      }));
  } catch {
    return [];
  }
}

export async function saveItem(_prev: State, formData: FormData): Promise<State> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const description =
    String(formData.get("description") ?? "").trim().slice(0, 200) || null;
  const price = Number(formData.get("price"));
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const isSpecial = formData.get("is_special") === "on";
  const spRaw = String(formData.get("special_price") ?? "").trim();
  const specialPrice = isSpecial && spRaw !== "" ? Number(spRaw) : null;

  if (!name) return { ok: false, error: "Please enter a name." };
  if (!Number.isFinite(price) || price < 0 || price > 100000) {
    return { ok: false, error: "Please enter a valid price." };
  }
  if (specialPrice !== null && (!Number.isFinite(specialPrice) || specialPrice < 0)) {
    return { ok: false, error: "Please enter a valid offer price." };
  }

  // image
  let imageUrl: string | null | undefined; // undefined = leave unchanged
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return { ok: false, error: "Image must be JPG, PNG or WebP." };
    }
    if (file.size > 4 * 1024 * 1024) {
      return { ok: false, error: "Image is too large (max 4 MB)." };
    }
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type });
    if (upErr) return { ok: false, error: "Could not upload the image." };
    imageUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  } else if (formData.get("remove_image") === "1") {
    imageUrl = null;
  }

  const payload: Record<string, unknown> = {
    name,
    description,
    price,
    category_id: categoryId,
    is_veg: formData.get("is_veg") === "on",
    is_available: formData.get("is_available") === "on",
    is_special: isSpecial,
    special_price: specialPrice,
  };
  if (imageUrl !== undefined) payload.image_url = imageUrl;

  let itemId = id;
  if (id) {
    const { error } = await supabase.from("menu_items").update(payload).eq("id", id);
    if (error) return { ok: false, error: "Could not save the item." };
  } else {
    const { data: last } = await supabase
      .from("menu_items")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data, error } = await supabase
      .from("menu_items")
      .insert({ ...payload, sort_order: (last?.sort_order ?? 0) + 1 })
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: "Could not save the item." };
    itemId = data.id;
  }

  // replace customization options
  const options = parseOptions(String(formData.get("options") ?? "[]"));
  await supabase.from("customization_options").delete().eq("item_id", itemId);
  if (options.length) {
    await supabase
      .from("customization_options")
      .insert(options.map((o) => ({ ...o, item_id: itemId })));
  }

  refresh();
  return { ok: true };
}

export async function setAvailability(id: string, value: boolean) {
  await requireAdmin();
  await supabase.from("menu_items").update({ is_available: value }).eq("id", id);
  refresh();
}

export async function setSpecial(id: string, value: boolean) {
  await requireAdmin();
  await supabase.from("menu_items").update({ is_special: value }).eq("id", id);
  refresh();
}

export async function deleteItem(id: string) {
  await requireAdmin();
  const { data } = await supabase
    .from("menu_items")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();
  await supabase.from("menu_items").delete().eq("id", id);

  const marker = `/${BUCKET}/`;
  const url = data?.image_url;
  if (url && url.includes(marker)) {
    await supabase.storage.from(BUCKET).remove([url.split(marker)[1]]);
  }
  refresh();
}