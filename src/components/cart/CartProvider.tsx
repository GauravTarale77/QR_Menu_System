"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type CartLine = {
  key: string;
  kind: "item" | "combo";
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  removes: { id: string; name: string }[];
  addons: { id: string; name: string; price: number }[];
  note: string;
};

type CartContext = {
  lines: CartLine[];
  count: number;
  total: number;
  orderingOpen: boolean;
  add: (line: Omit<CartLine, "key">) => void;
  setQty: (key: string, quantity: number) => void;
  clear: () => void;
};

const Ctx = createContext<CartContext | null>(null);

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}

const signature = (l: Omit<CartLine, "key">) =>
  [
    l.kind,
    l.id,
    l.removes.map((r) => r.id).sort().join(","),
    l.addons.map((a) => a.id).sort().join(","),
    l.note,
  ].join("|");

export default function CartProvider({
  orderingOpen,
  children,
}: {
  orderingOpen: boolean;
  children: ReactNode;
}) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const value = useMemo<CartContext>(
    () => ({
      lines,
      orderingOpen,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      total: lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
      add: (line) =>
        setLines((prev) => {
          const key = signature(line);
          const existing = prev.find((l) => l.key === key);
          if (existing) {
            return prev.map((l) =>
              l.key === key
                ? { ...l, quantity: Math.min(20, l.quantity + line.quantity) }
                : l
            );
          }
          return [...prev, { ...line, key }];
        }),
      setQty: (key, quantity) =>
        setLines((prev) =>
          quantity <= 0
            ? prev.filter((l) => l.key !== key)
            : prev.map((l) =>
                l.key === key ? { ...l, quantity: Math.min(20, quantity) } : l
              )
        ),
      clear: () => setLines([]),
    }),
    [lines, orderingOpen]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}