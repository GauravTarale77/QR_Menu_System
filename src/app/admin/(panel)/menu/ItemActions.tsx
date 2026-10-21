"use client";

import { useTransition } from "react";
import { deleteItem, setAvailability, setSpecial } from "./actions";

export default function ItemActions({
  id,
  name,
  available,
  special,
}: {
  id: string;
  name: string;
  available: boolean;
  special: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <div className={`flex flex-wrap gap-2 ${pending ? "opacity-50" : ""}`}>
      <button
        onClick={() => start(() => setAvailability(id, !available))}
        className={`rounded-full px-3 py-1 text-sm font-medium ${
          available ? "bg-leaf/15 text-leaf" : "bg-red-50 text-red-600"
        }`}
      >
        {available ? "Available" : "Sold out"}
      </button>
      <button
        onClick={() => start(() => setSpecial(id, !special))}
        className={`rounded-full px-3 py-1 text-sm font-medium ${
          special ? "bg-caramel text-white" : "bg-latte text-mocha"
        }`}
      >
        {special ? "★ Special" : "☆ Special"}
      </button>
      <button
        onClick={() => {
          if (confirm(`Delete "${name}"? This also removes it from any combos.`)) {
            start(() => deleteItem(id));
          }
        }}
        className="rounded-full px-3 py-1 text-sm font-medium text-red-600"
      >
        Delete
      </button>
    </div>
  );
}