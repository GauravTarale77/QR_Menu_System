"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { placeOrder } from "@/app/actions";
import { rupees } from "@/lib/format";

export default function CartBar({
  table,
  token,
}: {
  table: number;
  token: string;
}) {
    const router = useRouter();
  const { lines, count, total, setQty, clear } = useCart();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ orderNo: number; orderId: string } | null>(null);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const res = await placeOrder({
        table,
        token,
        note,
        lines: lines.map((l) => ({
          kind: l.kind,
          id: l.id,
          quantity: l.quantity,
          removes: l.removes.map((r) => r.id),
          addons: l.addons.map((a) => a.id),
          note: l.note,
        })),
      });
      if (res.ok) {
        clear();
        setNote("");
        try {
          localStorage.setItem(`lastOrder:${table}`, res.orderId);
        } catch {}
        setDone({ orderNo: res.orderNo, orderId: res.orderId });
      } else {
        setError(res.error);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function close() {
    setOpen(false);
    setDone(null);
    setError("");
  }

  if (!open) {
    if (count === 0) return null;
    return (
      <div className="fixed inset-x-0 bottom-0 z-30 p-4">
        <button
          onClick={() => setOpen(true)}
          className="mx-auto flex w-full max-w-3xl items-center justify-between rounded-full bg-espresso px-6 py-4 text-cream shadow-xl"
        >
          <span className="font-medium">
            {count} item{count > 1 ? "s" : ""} · {rupees(total)}
          </span>
          <span className="font-semibold text-caramel">View cart →</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-espresso/60">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-cream p-5 shadow-xl">
        {done ? (
          <div className="py-8 text-center">
            <div className="text-5xl">✅</div>
            <h3 className="mt-3 font-display text-2xl text-espresso">
              Order #{done.orderNo} placed!
            </h3>
            <p className="mt-2 text-mocha">
              We&apos;re preparing it and will bring it to Table {table}.
              Please pay at the counter.
            </p>
            <button
              onClick={() =>
                router.push(`/t/${table}/order/${done.orderId}?k=${token}`)
              }
              className="mt-6 w-full rounded-full bg-caramel px-8 py-3 font-semibold text-white"
            >
              Track my order
            </button>
            <button
              onClick={close}
              className="mt-3 w-full rounded-full bg-latte px-8 py-3 font-medium text-mocha"
            >
              Back to menu
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl text-espresso">
                Your order · Table {table}
              </h3>
              <button
                onClick={close}
                aria-label="Close"
                className="rounded-full bg-latte px-3 py-1 text-mocha"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 divide-y divide-latte">
              {lines.map((l) => (
                <div key={l.key} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-espresso">{l.name}</p>
                    {l.removes.length > 0 && (
                      <p className="text-xs text-mocha">
                        {l.removes.map((r) => r.name).join(", ")}
                      </p>
                    )}
                    {l.addons.length > 0 && (
                      <p className="text-xs text-mocha">
                        + {l.addons.map((a) => a.name).join(", ")}
                      </p>
                    )}
                    {l.note && (
                      <p className="text-xs italic text-mocha">“{l.note}”</p>
                    )}
                    <p className="mt-1 text-sm font-semibold text-espresso">
                      {rupees(l.unitPrice * l.quantity)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 rounded-full bg-white px-2 py-1 ring-1 ring-latte">
                    <button
                      onClick={() => setQty(l.key, l.quantity - 1)}
                      className="h-7 w-7 rounded-full bg-latte"
                      aria-label="Decrease"
                    >
                      −
                    </button>
                    <span className="w-5 text-center">{l.quantity}</span>
                    <button
                      onClick={() => setQty(l.key, l.quantity + 1)}
                      className="h-7 w-7 rounded-full bg-latte"
                      aria-label="Increase"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              rows={2}
              placeholder="Anything else for the kitchen? (optional)"
              className="mt-2 w-full rounded-xl bg-white p-3 ring-1 ring-latte outline-none focus:ring-caramel"
            />

            <div className="mt-4 space-y-2">
              <p className="font-medium text-espresso">Payment</p>
              <label className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 ring-2 ring-caramel">
                <input type="radio" checked readOnly className="accent-[#C98A4B]" />
                Pay at counter
              </label>
              <label className="flex items-center gap-3 rounded-xl bg-white/60 px-4 py-3 text-mocha ring-1 ring-latte">
                <input type="radio" disabled />
                Pay online (UPI) — coming soon
              </label>
            </div>

            {error && (
              <p className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              onClick={submit}
              disabled={busy || lines.length === 0}
              className="mt-5 w-full rounded-full bg-caramel py-4 text-lg font-semibold text-white shadow-md disabled:opacity-60"
            >
              {busy ? "Placing order..." : `Place order · ${rupees(total)}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}