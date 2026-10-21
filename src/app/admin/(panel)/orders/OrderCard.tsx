"use client";

import { useTransition } from "react";
import { markPaid, setOrderStatus } from "./actions";
import { rupees } from "@/lib/format";

export type LiveOrder = {
  id: string;
  order_no: number;
  table_number: number;
  status: "new" | "preparing" | "served" | "cancelled";
  payment_status: "pending" | "paid";
  payment_method: "counter" | "online";
  total: number;
  note: string | null;
  time: string;
  minutesAgo: number;
  order_items: {
    name: string;
    quantity: number;
    customizations: { name: string; kind: string; price: number }[];
    note: string | null;
  }[];
};

const BORDER = {
  new: "border-caramel",
  preparing: "border-blue-400",
  served: "border-leaf",
  cancelled: "border-red-300",
} as const;

export default function OrderCard({ order }: { order: LiveOrder }) {
  const [pending, start] = useTransition();
  const o = order;

  return (
    <div
      className={`rounded-2xl border-l-4 bg-white p-4 shadow-sm ring-1 ring-latte ${BORDER[o.status]} ${
        o.status === "cancelled" ? "opacity-60" : ""
      } ${pending ? "opacity-50" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-2xl text-espresso">Table {o.table_number}</p>
          <p className="text-xs text-mocha">
            Order #{o.order_no} · {o.time} ·{" "}
            {o.minutesAgo < 1 ? "just now" : `${o.minutesAgo} min ago`}
          </p>
        </div>
        <span className="font-semibold text-espresso">{rupees(o.total)}</span>
      </div>

      <ul className="mt-3 space-y-2 text-sm">
        {o.order_items.map((it, i) => (
          <li key={i}>
            <p className="font-medium text-espresso">
              {it.quantity} × {it.name}
            </p>
            {it.customizations.length > 0 && (
              <p className="text-xs text-mocha">
                {it.customizations
                  .map((c) => (c.kind === "remove" ? `No ${c.name}` : `+ ${c.name}`))
                  .join(", ")}
              </p>
            )}
            {it.note && <p className="text-xs italic text-mocha">“{it.note}”</p>}
          </li>
        ))}
      </ul>

      {o.note && (
        <p className="mt-2 rounded-lg bg-cream px-3 py-1.5 text-xs text-mocha">
          Note: {o.note}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {o.status === "new" && (
          <button
            onClick={() => start(() => setOrderStatus(o.id, "preparing"))}
            className="rounded-full bg-caramel px-4 py-1.5 text-sm font-semibold text-white"
          >
            Accept & prepare
          </button>
        )}
        {o.status === "preparing" && (
          <button
            onClick={() => start(() => setOrderStatus(o.id, "served"))}
            className="rounded-full bg-leaf px-4 py-1.5 text-sm font-semibold text-white"
          >
            Mark served
          </button>
        )}
        {(o.status === "new" || o.status === "preparing") && (
          <button
            onClick={() => {
              if (confirm(`Cancel order #${o.order_no}?`))
                start(() => setOrderStatus(o.id, "cancelled"));
            }}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-red-600"
          >
            Cancel
          </button>
        )}
        {o.status === "cancelled" && (
          <span className="text-sm font-medium text-red-600">Cancelled</span>
        )}
        {o.status !== "cancelled" &&
          (o.payment_status === "paid" ? (
            <span className="rounded-full bg-leaf/15 px-3 py-1 text-xs font-medium text-leaf">
              Paid ✓
            </span>
          ) : (
            <button
              onClick={() => start(() => markPaid(o.id))}
              className="rounded-full bg-latte px-3 py-1 text-xs font-medium text-mocha"
            >
              Payment pending · Mark paid
            </button>
          ))}
      </div>
    </div>
  );
}