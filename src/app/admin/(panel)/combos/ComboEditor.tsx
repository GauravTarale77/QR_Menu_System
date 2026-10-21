"use client";

import { useActionState, useEffect, useState } from "react";
import { saveCombo } from "./actions";
import { shrinkImage } from "@/lib/shrink-image";
import { rupees } from "@/lib/format";

export type PickItem = { id: string; name: string; price: number };
export type ComboData = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  combo_items: { item_id: string; quantity: number }[];
};

const inputCls =
  "w-full rounded-xl bg-white px-3 py-2 ring-1 ring-latte outline-none focus:ring-caramel";

export default function ComboEditor({
  items,
  combo,
}: {
  items: PickItem[];
  combo?: ComboData;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(saveCombo, undefined);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [price, setPrice] = useState(0);
  const [pic, setPic] = useState<File | null>(null);
  const [picError, setPicError] = useState("");

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  function openModal() {
    const q: Record<string, number> = {};
    combo?.combo_items.forEach((ci) => {
      q[ci.item_id] = ci.quantity;
    });
    setQty(q);
    setPrice(combo ? Number(combo.price) : 0);
    setPic(null);
    setPicError("");
    setOpen(true);
  }

  const change = (id: string, d: number) =>
    setQty((p) => ({ ...p, [id]: Math.max(0, Math.min(10, (p[id] ?? 0) + d)) }));

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setPicError("");
    if (!f) return setPic(null);
    try {
      setPic(await shrinkImage(f));
    } catch {
      setPic(null);
      setPicError("Could not read this image. Try a JPG or PNG.");
    }
  }

  const chosen = items.filter((i) => (qty[i.id] ?? 0) > 0);
  const separate = chosen.reduce((s, i) => s + i.price * qty[i.id], 0);
  const saving = separate - price;
  const payload = JSON.stringify(
    chosen.map((i) => ({ item_id: i.id, quantity: qty[i.id] }))
  );

  return (
    <>
      <button
        onClick={openModal}
        className={
          combo
            ? "rounded-full bg-latte px-3 py-1 text-sm font-medium text-mocha"
            : "rounded-full bg-caramel px-5 py-2 font-semibold text-white shadow-sm"
        }
      >
        {combo ? "Edit" : "+ New combo"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/60 p-3">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-cream p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-espresso">
                {combo ? "Edit combo" : "New combo"}
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
              <input type="hidden" name="id" value={combo?.id ?? ""} />
              <input type="hidden" name="items" value={payload} />

              <label className="block text-sm font-medium text-espresso">
                Combo name
                <input
                  name="name"
                  required
                  defaultValue={combo?.name}
                  placeholder="e.g. Sunday Special"
                  className={`${inputCls} mt-1`}
                />
              </label>
              <label className="block text-sm font-medium text-espresso">
                Description (optional)
                <textarea
                  name="description"
                  rows={2}
                  maxLength={200}
                  defaultValue={combo?.description ?? ""}
                  className={`${inputCls} mt-1`}
                />
              </label>

              <div>
                <p className="text-sm font-medium text-espresso">
                  Choose items (tap + to add)
                </p>
                <div className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-2xl bg-white p-2 ring-1 ring-latte">
                  {items.map((i) => (
                    <div
                      key={i.id}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5"
                    >
                      <span className="min-w-0 truncate text-sm">
                        {i.name}{" "}
                        <span className="text-mocha">({rupees(i.price)})</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => change(i.id, -1)}
                          className="h-7 w-7 rounded-full bg-latte"
                          aria-label={`Fewer ${i.name}`}
                        >
                          −
                        </button>
                        <span className="w-4 text-center text-sm">
                          {qty[i.id] ?? 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => change(i.id, 1)}
                          className="h-7 w-7 rounded-full bg-caramel text-white"
                          aria-label={`More ${i.name}`}
                        >
                          +
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <label className="block text-sm font-medium text-espresso">
                Combo price (₹)
                <input
                  name="price"
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={price || ""}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className={`${inputCls} mt-1`}
                />
              </label>

              {chosen.length > 0 && (
                <p
                  className={`rounded-xl px-3 py-2 text-sm ${
                    price > 0 && saving > 0
                      ? "bg-leaf/10 text-leaf"
                      : "bg-latte text-mocha"
                  }`}
                >
                  Items separately: {rupees(separate)}
                  {price > 0 &&
                    (saving > 0
                      ? ` · Customer saves ${rupees(saving)}`
                      : saving < 0
                        ? " · Combo costs more than the items separately"
                        : "")}
                </p>
              )}

              <label className="flex items-center gap-2 text-sm text-espresso">
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={combo?.is_active ?? true}
                  className="h-4 w-4 accent-[#5E8C3A]"
                />
                Show this combo to customers
              </label>

              <div className="text-sm font-medium text-espresso">
                Photo (JPG, PNG or WebP)
                {combo?.image_url && (
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
                {pending ? "Saving..." : "Save combo"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}