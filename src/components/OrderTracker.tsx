"use client";

import { useEffect, useState } from "react";
import { getOrderStatus, submitReview } from "@/app/actions";
import { rupees } from "@/lib/format";
import type { OrderView } from "@/lib/types";

const STEPS = [
  { key: "new", label: "Order received", hint: "Waiting for the kitchen to confirm" },
  { key: "preparing", label: "Being prepared", hint: "Your food is being made" },
  { key: "served", label: "Served", hint: "Enjoy your meal!" },
] as const;

function ReviewForm({
  orderId,
  table,
  token,
  already,
}: {
  orderId: string;
  table: number;
  token: string;
  already: boolean;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(already);

  async function send() {
    setBusy(true);
    setError("");
    try {
      const res = await submitReview({ orderId, table, token, rating, comment });
      if (res.ok) setDone(true);
      else setError(res.error);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mt-6 rounded-2xl bg-white p-5 text-center ring-1 ring-latte">
        <div className="text-3xl">💛</div>
        <p className="mt-2 font-display text-xl text-espresso">
          Thank you for your feedback!
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-latte">
      <h3 className="font-display text-xl text-espresso">How was everything?</h3>
      <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setRating(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className={`text-4xl transition ${
              rating >= n ? "text-caramel" : "text-latte"
            }`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder="Tell us more (optional)"
        className="mt-3 w-full rounded-xl bg-cream p-3 ring-1 ring-latte outline-none focus:ring-caramel"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        onClick={send}
        disabled={busy || rating === 0}
        className="mt-3 w-full rounded-full bg-caramel py-3 font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Sending..." : "Send feedback"}
      </button>
    </div>
  );
}

export default function OrderTracker({
  initial,
  table,
  token,
}: {
  initial: OrderView;
  table: number;
  token: string;
}) {
  const [order, setOrder] = useState(initial);

  useEffect(() => {
    if (order.status === "served" || order.status === "cancelled") return;
    const timer = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const fresh = await getOrderStatus({ orderId: order.id, table, token });
        if (fresh) setOrder(fresh);
      } catch {
        /* ignore, try again on the next tick */
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [order.id, order.status, table, token]);

  const current = STEPS.findIndex((s) => s.key === order.status);

  return (
    <div>
      <div className="text-center">
        <p className="text-sm text-mocha">Table {table}</p>
        <h1 className="font-display text-3xl text-espresso">
          Order #{order.order_no}
        </h1>
      </div>

      {order.status === "cancelled" ? (
        <div className="mt-6 rounded-2xl bg-red-50 p-5 text-center text-red-700">
          This order was cancelled. Please speak to our staff.
        </div>
      ) : (
        <ol className="mt-6 space-y-3 rounded-2xl bg-white p-5 ring-1 ring-latte">
          {STEPS.map((s, i) => {
            const state = i < current ? "done" : i === current ? "now" : "todo";
            return (
              <li key={s.key} className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    state === "todo"
                      ? "bg-latte text-mocha"
                      : "bg-leaf text-white"
                  } ${state === "now" && order.status !== "served" ? "animate-pulse" : ""}`}
                >
                  {state === "todo" ? i + 1 : "✓"}
                </span>
                <div>
                  <p
                    className={`font-medium ${
                      state === "todo" ? "text-mocha" : "text-espresso"
                    }`}
                  >
                    {s.label}
                  </p>
                  {state === "now" && (
                    <p className="text-sm text-mocha">{s.hint}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-latte">
        <h2 className="mb-2 font-display text-xl text-espresso">Your items</h2>
        <div className="divide-y divide-latte">
          {order.order_items.map((it, idx) => (
            <div key={idx} className="flex justify-between gap-3 py-2">
              <div>
                <p className="text-espresso">
                  {it.quantity} × {it.name}
                </p>
                {it.customizations.length > 0 && (
                  <p className="text-xs text-mocha">
                    {it.customizations.map((c) => c.name).join(", ")}
                  </p>
                )}
                {it.note && (
                  <p className="text-xs italic text-mocha">“{it.note}”</p>
                )}
              </div>
              <p className="font-medium text-espresso">
                {rupees(it.unit_price * it.quantity)}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between border-t border-latte pt-3 font-semibold text-espresso">
          <span>Total (pay at counter)</span>
          <span>{rupees(order.total)}</span>
        </div>
      </div>

      {order.status === "served" && (
        <ReviewForm
          orderId={order.id}
          table={table}
          token={token}
          already={order.reviewed}
        />
      )}
    </div>
  );
}