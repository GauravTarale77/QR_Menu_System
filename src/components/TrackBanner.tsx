"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function TrackBanner({
  table,
  token,
}: {
  table: number;
  token: string;
}) {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    try {
      setId(localStorage.getItem(`lastOrder:${table}`));
    } catch {}
  }, [table]);

  if (!id) return null;

  return (
    <div className="mx-auto mb-4 max-w-3xl px-4">
      <Link
        href={`/t/${table}/order/${id}?k=${token}`}
        className="flex items-center justify-between rounded-xl bg-leaf/10 px-4 py-3 text-sm font-medium text-leaf ring-1 ring-leaf/30"
      >
        <span>Track your last order</span>
        <span>→</span>
      </Link>
    </div>
  );
}