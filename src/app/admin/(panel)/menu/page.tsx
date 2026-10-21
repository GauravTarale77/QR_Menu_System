import { supabase } from "@/lib/supabase";
import { rupees } from "@/lib/format";
import FoodImage from "@/components/FoodImage";
import VegMark from "@/components/VegMark";
import CategoryManager from "./CategoryManager";
import ItemEditor from "./ItemEditor";
import ItemActions from "./ItemActions";
import type { Category, MenuItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const [cats, itemsRes] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase
      .from("menu_items")
      .select("*, customization_options(*)")
      .order("sort_order"),
  ]);
  const categories = (cats.data ?? []) as Category[];
  const items = (itemsRes.data ?? []) as MenuItem[];

  const groups = [
    ...categories.map((c) => ({
      key: c.id,
      title: c.name,
      list: items.filter((i) => i.category_id === c.id),
    })),
    {
      key: "none",
      title: "No category (hidden from customers)",
      list: items.filter((i) => !i.category_id),
    },
  ].filter((g) => g.list.length > 0 || g.key !== "none");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-espresso">Menu</h1>
        <ItemEditor categories={categories} />
      </div>

      <CategoryManager categories={categories} />

      {groups.map((g) => (
        <section key={g.key}>
          <h2 className="mb-3 font-display text-xl text-espresso">{g.title}</h2>
          {g.list.length === 0 ? (
            <p className="text-sm text-mocha">No items yet.</p>
          ) : (
            <div className="space-y-3">
              {g.list.map((it) => (
                <div
                  key={it.id}
                  className="flex flex-col gap-3 rounded-2xl bg-white p-3 ring-1 ring-latte sm:flex-row sm:items-center"
                >
                  <div className="flex flex-1 items-center gap-3">
                    <FoodImage
                      src={it.image_url}
                      alt={it.name}
                      className="h-16 w-16 shrink-0 rounded-xl"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <VegMark veg={it.is_veg} />
                        <p className="truncate font-medium text-espresso">{it.name}</p>
                      </div>
                      <p className="text-sm text-mocha">
                        {rupees(it.price)}
                        {it.is_special && it.special_price != null && (
                          <span className="ml-2 font-medium text-caramel">
                            Offer {rupees(it.special_price)}
                          </span>
                        )}
                        {it.customization_options.length > 0 && (
                          <span className="ml-2 text-xs">
                            · {it.customization_options.length} options
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <ItemActions
                      id={it.id}
                      name={it.name}
                      available={it.is_available}
                      special={it.is_special}
                    />
                    <ItemEditor categories={categories} item={it} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}