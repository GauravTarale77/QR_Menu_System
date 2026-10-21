"use client";

import { useTransition } from "react";
import { freeTable, toggleReserved } from "./actions";

export type TableState = "empty" | "reserved" | "waiting" | "preparing" | "occupied";

const STYLE: Record<TableState, { label: string; cls: string }> = {
  empty: { label: "Empty", cls: "bg-leaf/15 text-leaf" },
  reserved: { label: "Reserved", cls: "bg-red-50 text-red-600" },
  waiting: { label: "Order placed · waiting", cls: "bg-caramel text-white" },
  preparing: { label: "Preparing", cls: "bg-blue-100 text-blue-700" },
  occupied: { label: "Occupied", cls: "bg-mocha text-white" },
};

export default function TableCard({
  number,
  state,
}: {
  number: number;
  state: TableState;
}) {
  const [pending, start] = useTransition();
  const s = STYLE[state];

  return (
    <div className={`rounded-2xl bg-white p-4 text-center ring-1 ring-latte ${pending ? "opacity-50" : ""}`}>
      <p className="font-display text-2xl text-espresso">Table {number}</p>
      <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${s.cls}`}>
        {s.label}
      </span>
      <div className="mt-3">
        {state === "empty" && (
          <button
            onClick={() => start(() => toggleReserved(number, true))}
            className="rounded-full bg-latte px-3 py-1 text-xs font-medium text-mocha"
          >
            Reserve
          </button>
        )}
        {state === "reserved" && (
          <button
            onClick={() => start(() => freeTable(number))}
            className="rounded-full bg-latte px-3 py-1 text-xs font-medium text-mocha"
          >
            Cancel reservation
          </button>
        )}
        {state === "occupied" && (
          <button
            onClick={() => start(() => freeTable(number))}
            className="rounded-full bg-latte px-3 py-1 text-xs font-medium text-mocha"
          >
            Customer left · Free table
          </button>
        )}
      </div>
    </div>
  );
}