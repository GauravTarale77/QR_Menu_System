import FoodImage from "./FoodImage";
import VegMark from "./VegMark";
import AddButton from "./cart/AddButton";
import { rupees } from "@/lib/format";
import type { MenuItem } from "@/lib/types";

export default function MenuItemCard({ item }: { item: MenuItem }) {
  return (
    <div
      className={`flex gap-4 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-latte ${
        item.is_available ? "" : "opacity-60"
      }`}
    >
      <FoodImage
        src={item.image_url}
        alt={item.name}
        className="h-24 w-24 shrink-0 rounded-xl"
      />
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <div className="flex items-center gap-2">
            <VegMark veg={item.is_veg} />
            <h3 className="font-display text-lg leading-tight text-espresso">
              {item.name}
            </h3>
          </div>
          {item.description && (
            <p className="mt-1 line-clamp-2 text-sm text-mocha">
              {item.description}
            </p>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-semibold text-espresso">{rupees(item.price)}</span>
          <AddButton
            kind="item"
            id={item.id}
            name={item.name}
            price={item.price}
            options={item.customization_options}
            available={item.is_available}
          />
        </div>
      </div>
    </div>
  );
}