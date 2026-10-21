"use client";

import { useTransition } from "react";
import { regenerateToken } from "./actions";

export default function RegenButton({ table }: { table: number }) {
  const [pending, start] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (
          confirm(
            `Make a new QR code for Table ${table}? The old printed QR will stop working and you will need to print and replace it.`
          )
        ) {
          start(() => regenerateToken(table));
        }
      }}
      className="rounded-full px-3 py-1 text-sm font-medium text-red-600 disabled:opacity-50"
    >
      {pending ? "Working..." : "New QR code"}
    </button>
  );
}