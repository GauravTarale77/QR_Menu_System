"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Live orders" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/combos", label: "Combos" },
  { href: "/admin/tables", label: "Tables & QR" },
];

export default function AdminNav() {
  const path = usePathname();
  return (
    <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3">
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ${
              active ? "bg-espresso text-cream" : "bg-latte text-mocha"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}