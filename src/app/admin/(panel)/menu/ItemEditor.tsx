"use client";

import { useActionState, useEffect, useState } from "react";
import { saveItem } from "./actions";
import type { Category, MenuItem } from "@/lib/types";

type Opt = { name: string; kind: "remove" | "addon"; price: number };
const inputCls =
  "w-full rounded-xl bg-white px-3 py-2 ring-1 ring-latte outline-none focus:ring-caramel";
  async function shrink(file: File): Promise<File> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bmp, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((r) =>
    canvas.toBlob(r, "image/jpeg", 0.82)
  );
  if (!blob) throw new Error("Could not process image");
  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}

export default function ItemEditor({
  categories,
  item,
}: {
  categories: Category[];
  item?: MenuItem;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(saveItem, undefined);
  const [options, setOptions] = useState<Opt[]>([]);
  const [special, setSpecial] = useState(false);
  const [draft, setDraft] = useState<Opt>({ name: "", kind: "remove", price: 0 });
  const [pic, setPic] = useState<File | null>(null);
  const [picError, setPicError] = useState("");

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setPicError("");
    if (!f) {
      setPic(null);
      return;
    }
    try {
      setPic(await shrink(f));
    } catch {
      setPic(null);
      setPicError("Could not read this image. Try a JPG or PNG.");
    }
  }

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  function openModal() {
    setOptions(
      (item?.customization_options ?? []).map((o) => ({
        name: o.name,
        kind: o.kind,
        price: Number(o.price),
      }))
    );
    setSpecial(item?.is_special ?? false);
    setDraft({ name: "", kind: "remove", price: 0 });
    setPic(null);
    setPicError("");
    setOpen(true);
  }

  function addOption() {
    const name = draft.name.trim();
    if (!name) return;
    setOptions([
      ...options,
      { name, kind: draft.kind, price: draft.kind === "remove" ? 0 : Math.max(0, Number(draft.price) || 0) },
    ]);
    setDraft({ name: "", kind: draft.kind, price: 0 });
  }

  return (
    <>
      <button
        onClick={openModal}
        className={
          item
            ? "rounded-full bg-latte px-3 py-1 text-sm font-medium text-mocha"
            : "rounded-full bg-caramel px-5 py-2 font-semibold text-white shadow-sm"
        }
      >
        {item ? "Edit" : "+ Add item"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/60 p-3">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-cream p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-espresso">
                {item ? "Edit item" : "Add item"}
              </h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full bg-latte px-3 py-1 text-mocha"
              >
                ✕
              </button>
            </div>

            <form
              action={(fd) => {
                fd.delete("image");
                if (pic) fd.set("image", pic, "photo.jpg");
                action(fd);
              }}
              className="mt-4 space-y-3"
            >
              <input type="hidden" name="id" value={item?.id ?? ""} />
              <input type="hidden" name="options" value={JSON.stringify(options)} />

              <label className="block text-sm font-medium text-espresso">
                Name
                <input name="name" required defaultValue={item?.name} className={`${inputCls} mt-1`} />
              </label>
              <label className="block text-sm font-medium text-espresso">
                Description
                <textarea
                  name="description"
                  rows={2}
                  maxLength={200}
                  defaultValue={item?.description ?? ""}
                  className={`${inputCls} mt-1`}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium text-espresso">
                  Price (₹)
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="1"
                    required
                    defaultValue={item?.price}
                    className={`${inputCls} mt-1`}
                  />
                </label>
                <label className="block text-sm font-medium text-espresso">
                  Category
                  <select
                    name="category_id"
                    defaultValue={item?.category_id ?? categories[0]?.id ?? ""}
                    className={`${inputCls} mt-1`}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-espresso">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="is_veg" defaultChecked={item?.is_veg ?? true} className="h-4 w-4 accent-[#5E8C3A]" />
                  Vegetarian
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="is_available" defaultChecked={item?.is_available ?? true} className="h-4 w-4 accent-[#5E8C3A]" />
                  Available
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_special"
                    checked={special}
                    onChange={(e) => setSpecial(e.target.checked)}
                    className="h-4 w-4 accent-[#C98A4B]"
                  />
                  Today&apos;s Special
                </label>
              </div>

              {special && (
                <label className="block text-sm font-medium text-espresso">
                  Offer price (₹), optional
                  <input
                    name="special_price"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={item?.special_price ?? ""}
                    className={`${inputCls} mt-1`}
                  />
                </label>
              )}

              <div className="text-sm font-medium text-espresso">
                Photo (JPG, PNG or WebP)
                {item?.image_url && (
                  <label className="mt-1 flex items-center gap-2 font-normal text-mocha">
                    <input type="checkbox" name="remove_image" value="1" />
                    Remove current photo
                  </label>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={onPick}
                  className="mt-1 block w-full text-sm font-normal"
                />
                {pic && (
                  <p className="mt-1 text-xs font-normal text-leaf">
                    Photo ready ({Math.round(pic.size / 1024)} KB)
                  </p>
                )}
                {picError && (
                  <p className="mt-1 text-xs font-normal text-red-600">{picError}</p>
                )}
              </div>

              <div className="rounded-2xl bg-white p-3 ring-1 ring-latte">
                <p className="text-sm font-medium text-espresso">
                  Customization options
                </p>
                <p className="text-xs text-mocha">
                  &quot;Remove&quot; = no onion, no tomato. &quot;Extra&quot; = paid add-ons like extra cheese.
                </p>
                <ul className="mt-2 space-y-1">
                  {options.map((o, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg bg-cream px-3 py-1.5 text-sm">
                      <span>
                        {o.kind === "remove" ? "No " : "+ "}
                        {o.name}
                        {o.kind === "addon" ? ` (₹${o.price})` : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOptions(options.filter((_, j) => j !== i))}
                        className="text-red-600"
                        aria-label="Remove option"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex flex-wrap gap-2">
                  <select
                    value={draft.kind}
                    onChange={(e) =>
                      setDraft({ ...draft, kind: e.target.value as "remove" | "addon" })
                    }
                    className="rounded-lg bg-cream px-2 py-1.5 text-sm ring-1 ring-latte"
                  >
                    <option value="remove">Remove</option>
                    <option value="addon">Extra</option>
                  </select>
                  <input
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addOption();
                      }
                    }}
                    placeholder="e.g. onion"
                    className="min-w-0 flex-1 rounded-lg bg-cream px-2 py-1.5 text-sm ring-1 ring-latte"
                  />
                  {draft.kind === "addon" && (
                    <input
                      type="number"
                      min="0"
                      value={draft.price}
                      onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
                      className="w-20 rounded-lg bg-cream px-2 py-1.5 text-sm ring-1 ring-latte"
                      aria-label="Extra price"
                    />
                  )}
                  <button
                    type="button"
                    onClick={addOption}
                    className="rounded-lg bg-mocha px-3 py-1.5 text-sm text-white"
                  >
                    Add
                  </button>
                </div>
              </div>

              {state && !state.ok && (
                <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
                  {state.error}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-full bg-caramel py-3 font-semibold text-white shadow-md disabled:opacity-60"
              >
                {pending ? "Saving..." : "Save item"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}