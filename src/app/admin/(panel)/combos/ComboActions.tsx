"use client";

import { useTransition } from "react";
import { deleteCombo, setComboActive } from "./actions";

export default function ComboActions({
  id,
  name,
  active,
}: {
  id: string;
  name: string;
  active: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <div className={`flex flex-wrap gap-2 ${pending ? "opacity-50" : ""}`}>
      <button
        onClick={() => start(() => setComboActive(id, !active))}
        className={`rounded-full px-3 py-1 text-sm font-medium ${
          active ? "bg-leaf/15 text-leaf" : "bg-latte text-mocha"
        }`}
      >
        {active ? "● Live" : "○ Hidden"}
      </button>
      <button
        onClick={() => {
          if (confirm(`Delete combo "${name}"?`)) start(() => deleteCombo(id));
        }}
        className="rounded-full px-3 py-1 text-sm font-medium text-red-600"
      >
        Delete
      </button>
    </div>
  );
}