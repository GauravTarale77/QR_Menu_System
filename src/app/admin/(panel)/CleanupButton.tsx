"use client";

import { useTransition } from "react";
import { runCleanup } from "./actions";

export default function CleanupButton() {
  const [pending, start] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete orders older than 30 days now? Daily totals are kept.")) return;
        start(async () => {
          const res = await runCleanup();
          alert(res.message);
        });
      }}
      className="rounded-full bg-latte px-4 py-1.5 text-sm font-medium text-mocha disabled:opacity-50"
    >
      {pending ? "Cleaning..." : "Run cleanup now"}
    </button>
  );
}