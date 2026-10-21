"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

const BUCKET = "menu-images";
type State = { ok: true } | { ok: false; error: string } | undefined;
const refresh = () => revalidatePath("/admin/combos");

export async function saveCombo(_prev: State, formData: FormData): Promise<State> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const description =
    String(formData.get("description") ?? "").trim().slice(0, 200) || null;
  const price = Number(formData.get("price"));

  if (!name) return { ok: false, error: "Please enter a combo name." };
  if (!Number.isFinite(price) || price <= 0 || price > 100000) {
    return { ok: false, error: "Please enter a valid combo price." };
  }

  let items: { item_id: string; quantity: number }[] = [];
  try {
    const raw = JSON.parse(String(formData.get("items") ?? "[]"));
    if (Array.isArray(raw)) {
      items = raw
        .map((r) => ({
          item_id: String(r?.item_id ?? ""),
          quantity: Math.floor(Number(r?.quantity)),
        }))
        .filter((r) => r.item_id && r.quantity >= 1 && r.quantity <= 10)
        .slice(0, 20);
    }
  } catch {}
  if (items.length < 2) {
    return { ok: false, error: "A combo needs at least 2 items." };
  }

  let imageUrl: string | null | undefined;
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
    if (upErr) {
      console.error("Combo image upload failed:", upErr);
      return { ok: false, error: `Could not upload the image: ${upErr.message}` };
    }
    imageUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  } else if (formData.get("remove_image") === "1") {
    imageUrl = null;
  }

  const payload: Record<string, unknown> = {
    name,
    description,
    price,
    is_active: formData.get("is_active") === "on",
  };
  if (imageUrl !== undefined) payload.image_url = imageUrl;

  let comboId = id;
  if (id) {
    const { error } = await supabase.from("combos").update(payload).eq("id", id);
    if (error) return { ok: false, error: "Could not save the combo." };
  } else {
    const { data, error } = await supabase
      .from("combos")
      .insert(payload)
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: "Could not save the combo." };
    comboId = data.id;
  }

  await supabase.from("combo_items").delete().eq("combo_id", comboId);
  const { error: ciErr } = await supabase
    .from("combo_items")
    .insert(items.map((i) => ({ ...i, combo_id: comboId })));
  if (ciErr) return { ok: false, error: "Could not save the combo items." };

  refresh();
  return { ok: true };
}

export async function setComboActive(id: string, value: boolean) {
  await requireAdmin();
  await supabase.from("combos").update({ is_active: value }).eq("id", id);
  refresh();
}

export async function deleteCombo(id: string) {
  await requireAdmin();
  const { data } = await supabase
    .from("combos")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();
  await supabase.from("combos").delete().eq("id", id);

  const marker = `/${BUCKET}/`;
  const url = data?.image_url;
  if (url && url.includes(marker)) {
    await supabase.storage.from(BUCKET).remove([url.split(marker)[1]]);
  }
  refresh();
}