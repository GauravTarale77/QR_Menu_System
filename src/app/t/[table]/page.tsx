import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import { getMenu, getTable } from "@/lib/menu";
import { rupees } from "@/lib/format";
import CategoryNav from "@/components/CategoryNav";
import FoodImage from "@/components/FoodImage";
import MenuItemCard from "@/components/MenuItemCard";
import VegMark from "@/components/VegMark";
import CartProvider from "@/components/cart/CartProvider";
import CartBar from "@/components/cart/CartBar";
import AddButton from "@/components/cart/AddButton";
import TrackBanner from "@/components/TrackBanner";

export const dynamic = "force-dynamic";
export const metadata = { title: "Menu" };

export default async function TablePage({
  params,
  searchParams,
}: {
  params: Promise<{ table: string }>;
  searchParams: Promise<{ k?: string }>;
}) {
  const { table } = await params;
  const { k } = await searchParams;
  const tableNo = Number(table);

  const valid =
    Number.isInteger(tableNo) && k ? await getTable(tableNo, k) : null;

  if (!valid || !k) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="font-display text-3xl text-espresso">
          Please scan the QR code on your table
        </h1>
        <p className="text-mocha">This link is not valid. Ask our staff for help.</p>
      </main>
    );
  }

  const { categories, items, combos, orderingOpen } = await getMenu();
  const specials = items.filter((i) => i.is_special && i.is_available);

  const links = [
    ...(combos.length ? [{ id: "combos", label: "Combos" }] : []),
    ...(specials.length ? [{ id: "special", label: "Today's Special" }] : []),
    ...categories.map((c) => ({ id: `cat-${c.id}`, label: c.name })),
  ];

  return (
    <CartProvider orderingOpen={orderingOpen}>
      <main className="pb-32">
        <Hero table={tableNo} />

        {!orderingOpen && (
          <div className="mx-auto mb-4 max-w-3xl rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-700">
            Ordering is currently closed. You can still browse the menu.
          </div>
        )}

        <TrackBanner table={tableNo} token={k} />
        <CategoryNav links={links} />

        <div className="mx-auto max-w-3xl space-y-10 px-4 pt-8">
          {combos.length > 0 && (
            <section id="combos" className="scroll-mt-20 fade-up">
              <h2 className="mb-4 font-display text-2xl text-espresso">Combos</h2>
              <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
                {combos.map((c) => (
                  <div
                    key={c.id}
                    className="w-64 shrink-0 snap-start overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-latte"
                  >
                    <FoodImage src={c.image_url} alt={c.name} className="h-36 w-full" />
                    <div className="p-4">
                      <h3 className="font-display text-lg text-espresso">{c.name}</h3>
                      <p className="mt-1 text-xs text-mocha">
                        {c.combo_items
                          .map(
                            (ci) =>
                              `${ci.quantity > 1 ? ci.quantity + "× " : ""}${ci.menu_items?.name ?? ""}`
                          )
                          .join(" + ")}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-semibold text-espresso">
                          {rupees(c.price)}
                        </span>
                        <AddButton kind="combo" id={c.id} name={c.name} price={c.price} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {specials.length > 0 && (
            <section id="special" className="scroll-mt-20 fade-up">
              <h2 className="mb-4 font-display text-2xl text-espresso">
                Today&apos;s Special
              </h2>
              <div className="space-y-3">
                {specials.map((s) => (
                  <div
                    key={s.id}
                    className="flex gap-4 rounded-2xl bg-espresso p-3 text-cream"
                  >
                    <FoodImage
                      src={s.image_url}
                      alt={s.name}
                      className="h-24 w-24 shrink-0 rounded-xl"
                    />
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <VegMark veg={s.is_veg} />
                          <h3 className="font-display text-lg">{s.name}</h3>
                        </div>
                        {s.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-latte">
                            {s.description}
                          </p>
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <p>
                          <span className="font-semibold text-caramel">
                            {rupees(s.special_price ?? s.price)}
                          </span>
                          {s.special_price && (
                            <span className="ml-2 text-sm text-latte line-through">
                              {rupees(s.price)}
                            </span>
                          )}
                        </p>
                        <AddButton
                          kind="item"
                          id={s.id}
                          name={s.name}
                          price={s.special_price ?? s.price}
                          options={s.customization_options}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {categories.map((cat) => {
            const list = items.filter((i) => i.category_id === cat.id);
            if (!list.length) return null;
            return (
              <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-20 fade-up">
                <h2 className="mb-4 font-display text-2xl text-espresso">
                  {cat.name}
                </h2>
                <div className="space-y-3">
                  {list.map((item) => (
                    <MenuItemCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
        <Footer />
      </main>

      <CartBar table={tableNo} token={k} />
    </CartProvider>
  );
}