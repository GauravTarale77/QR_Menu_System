"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import { rupees } from "@/lib/format";
import type { CustomizationOption } from "@/lib/types";

export default function CustomizeSheet({
  id,
  name,
  price,
  options,
  onClose,
}: {
  id: string;
  name: string;
  price: number;
  options: CustomizationOption[];
  onClose: () => void;
}) {
  const { add } = useCart();
  const [removes, setRemoves] = useState<string[]>([]);
  const [addons, setAddons] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  const removeOpts = options.filter((o) => o.kind === "remove");
  const addonOpts = options.filter((o) => o.kind === "addon");
  const extra = addonOpts
    .filter((o) => addons.includes(o.id))
    .reduce((s, o) => s + o.price, 0);
  const unit = price + extra;

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  function submit() {
    add({
      kind: "item",
      id,
      name,
      unitPrice: unit,
      quantity: qty,
      removes: removeOpts
        .filter((o) => removes.includes(o.id))
        .map((o) => ({ id: o.id, name: o.name })),
      addons: addonOpts
        .filter((o) => addons.includes(o.id))
        .map((o) => ({ id: o.id, name: o.name, price: o.price })),
      note: note.trim(),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-espresso/60">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-cream p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl text-espresso">{name}</h3>
            <p className="text-sm text-mocha">Make it yours</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full bg-latte px-3 py-1 text-mocha"
          >
            ✕
          </button>
        </div>

        {removeOpts.length > 0 && (
          <div className="mt-5">
            <h4 className="mb-2 font-medium text-espresso">Remove</h4>
            <div className="space-y-2">
              {removeOpts.map((o) => (
                <label
                  key={o.id}
                  className="flex items-center justify-between rounded-xl bg-white px-4 py-3 ring-1 ring-latte"
                >
                  <span>{o.name}</span>
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-[#C98A4B]"
                    checked={removes.includes(o.id)}
                    onChange={() => toggle(removes, setRemoves, o.id)}
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {addonOpts.length > 0 && (
          <div className="mt-5">
            <h4 className="mb-2 font-medium text-espresso">Add extras</h4>
            <div className="space-y-2">
              {addonOpts.map((o) => (
                <label
                  key={o.id}
                  className="flex items-center justify-between rounded-xl bg-white px-4 py-3 ring-1 ring-latte"
                >
                  <span>
                    {o.name}{" "}
                    <span className="text-mocha">+ {rupees(o.price)}</span>
                  </span>
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-[#C98A4B]"
                    checked={addons.includes(o.id)}
                    onChange={() => toggle(addons, setAddons, o.id)}
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5">
          <h4 className="mb-2 font-medium text-espresso">Special instructions</h4>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            rows={2}
            placeholder="E.g. less sugar, well done..."
            className="w-full rounded-xl bg-white p-3 ring-1 ring-latte outline-none focus:ring-caramel"
          />
        </div>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex items-center gap-3 rounded-full bg-white px-3 py-2 ring-1 ring-latte">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="h-7 w-7 rounded-full bg-latte"
              aria-label="Decrease"
            >
              −
            </button>
            <span className="w-5 text-center font-medium">{qty}</span>
            <button
              onClick={() => setQty(Math.min(20, qty + 1))}
              className="h-7 w-7 rounded-full bg-latte"
              aria-label="Increase"
            >
              +
            </button>
          </div>
          <button
            onClick={submit}
            className="flex-1 rounded-full bg-caramel py-3 font-semibold text-white shadow-md"
          >
            Add to cart · {rupees(unit * qty)}
          </button>
        </div>
      </div>
    </div>
  );
}