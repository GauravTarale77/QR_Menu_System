"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import CustomizeSheet from "./CustomizeSheet";
import type { CustomizationOption } from "@/lib/types";

export default function AddButton({
  kind,
  id,
  name,
  price,
  options = [],
  available = true,
}: {
  kind: "item" | "combo";
  id: string;
  name: string;
  price: number;
  options?: CustomizationOption[];
  available?: boolean;
}) {
  const { add, orderingOpen } = useCart();
  const [open, setOpen] = useState(false);

  if (!available) {
    return <span className="text-xs font-medium text-red-500">Sold out</span>;
  }
  if (!orderingOpen) return null;

  const customizable = kind === "item" && options.length > 0;

  function handleClick() {
    if (customizable) {
      setOpen(true);
    } else {
      add({
        kind,
        id,
        name,
        unitPrice: price,
        quantity: 1,
        removes: [],
        addons: [],
        note: "",
      });
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="rounded-full bg-caramel px-5 py-1.5 text-sm font-semibold text-white shadow-sm transition active:scale-95"
      >
        {customizable ? "Customize" : "Add +"}
      </button>
      {open && (
        <CustomizeSheet
          id={id}
          name={name}
          price={price}
          options={options}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}