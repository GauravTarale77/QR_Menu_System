import { supabase } from "@/lib/supabase";
import { rupees } from "@/lib/format";
import FoodImage from "@/components/FoodImage";
import ComboEditor, { type ComboData, type PickItem } from "./ComboEditor";
import ComboActions from "./ComboActions";

export const dynamic = "force-dynamic";

type Row = Omit<ComboData, "combo_items"> & {
  combo_items: {
    item_id: string;
    quantity: number;
    menu_items: { name: string; price: number } | null;
  }[];
};

export default async function AdminCombosPage() {
  const [combosRes, itemsRes] = await Promise.all([
    supabase
      .from("combos")
      .select("*, combo_items(item_id, quantity, menu_items(name, price))")
      .order("created_at", { ascending: false }),
    supabase
      .from("menu_items")
      .select("id, name, price")
      .order("sort_order"),
  ]);

  const combos = (combosRes.data ?? []) as unknown as Row[];
  const items = ((itemsRes.data ?? []) as PickItem[]).map((i) => ({
    ...i,
    price: Number(i.price),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-espresso">Combos & offers</h1>
          <p className="text-sm text-mocha">
            Combos appear at the top of the customer menu while they are Live.
          </p>
        </div>
        <ComboEditor items={items} />
      </div>

      {combos.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-mocha ring-1 ring-latte">
          No combos yet. Click &quot;+ New combo&quot; to create your first offer.
        </p>
      ) : (
        <div className="space-y-3">
          {combos.map((c) => {
            const separate = c.combo_items.reduce(
              (s, ci) => s + Number(ci.menu_items?.price ?? 0) * ci.quantity,
              0
            );
            const saving = separate - Number(c.price);
            return (
              <div
                key={c.id}
                className={`flex flex-col gap-3 rounded-2xl bg-white p-3 ring-1 ring-latte sm:flex-row sm:items-center ${
                  c.is_active ? "" : "opacity-70"
                }`}
              >
                <div className="flex flex-1 items-center gap-3">
                  <FoodImage
                    src={c.image_url}
                    alt={c.name}
                    className="h-16 w-16 shrink-0 rounded-xl"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-espresso">{c.name}</p>
                    <p className="text-xs text-mocha">
                      {c.combo_items
                        .map(
                          (ci) =>
                            `${ci.quantity > 1 ? ci.quantity + "× " : ""}${ci.menu_items?.name ?? "(deleted item)"}`
                        )
                        .join(" + ")}
                    </p>
                    <p className="text-sm text-espresso">
                      {rupees(Number(c.price))}
                      {saving > 0 && (
                        <span className="ml-2 text-xs font-medium text-leaf">
                          Saves {rupees(saving)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ComboActions id={c.id} name={c.name} active={c.is_active} />
                  <ComboEditor
                    items={items}
                    combo={{
                      id: c.id,
                      name: c.name,
                      description: c.description,
                      price: Number(c.price),
                      image_url: c.image_url,
                      is_active: c.is_active,
                      combo_items: c.combo_items.map((ci) => ({
                        item_id: ci.item_id,
                        quantity: ci.quantity,
                      })),
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}