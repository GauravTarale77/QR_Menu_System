import { supabase } from "@/lib/supabase";
import LiveRefresher from "./LiveRefresher";
import OrderCard, { type LiveOrder } from "./OrderCard";
import TableCard, { type TableState } from "./TableCard";

export const dynamic = "force-dynamic";

type Row = Omit<LiveOrder, "time" | "minutesAgo" | "total"> & {
  total: number | string;
  created_at: string;
};

export default async function LiveOrdersPage() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [ordersRes, tablesRes] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, order_no, table_number, status, payment_status, payment_method, total, note, created_at, order_items(name, quantity, customizations, note)"
      )
      .gte("created_at", since)
      .order("created_at", { ascending: true }),
    supabase.from("cafe_tables").select("number, is_reserved, cleared_at").order("number"),
  ]);

  const now = Date.now();
  const rows = (ordersRes.data ?? []) as unknown as Row[];
  const orders: (LiveOrder & { created_at: string })[] = rows.map((r) => ({
    ...r,
    total: Number(r.total),
    time: new Date(r.created_at).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    }),
    minutesAgo: Math.floor((now - new Date(r.created_at).getTime()) / 60000),
  }));

  const tables = (tablesRes.data ?? []) as {
    number: number;
    is_reserved: boolean;
    cleared_at: string;
  }[];

  const tableState = (t: (typeof tables)[number]): TableState => {
    const mine = orders.filter(
      (o) =>
        o.table_number === t.number &&
        o.status !== "cancelled" &&
        new Date(o.created_at) > new Date(t.cleared_at)
    );
    if (mine.some((o) => o.status === "new")) return "waiting";
    if (mine.some((o) => o.status === "preparing")) return "preparing";
    if (mine.length > 0) return "occupied";
    if (t.is_reserved) return "reserved";
    return "empty";
  };

  const fresh = orders.filter((o) => o.status === "new");
  const cooking = orders.filter((o) => o.status === "preparing");
  const done = orders
    .filter((o) => o.status === "served" || o.status === "cancelled")
    .reverse()
    .slice(0, 20);

  const column = (title: string, list: typeof orders, empty: string) => (
    <section>
      <h2 className="mb-3 font-display text-xl text-espresso">
        {title} <span className="text-mocha">({list.length})</span>
      </h2>
      <div className="space-y-3">
        {list.length === 0 ? (
          <p className="rounded-2xl bg-white/60 p-4 text-sm text-mocha ring-1 ring-latte">
            {empty}
          </p>
        ) : (
          list.map((o) => <OrderCard key={o.id} order={o} />)
        )}
      </div>
    </section>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-espresso">Live orders</h1>
        <LiveRefresher newCount={fresh.length} />
      </div>

      <section>
        <h2 className="mb-3 font-display text-xl text-espresso">Tables</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {tables.map((t) => (
            <TableCard key={t.number} number={t.number} state={tableState(t)} />
          ))}
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        {column("New", fresh, "No new orders.")}
        {column("Preparing", cooking, "Nothing in the kitchen.")}
        {column("Done", done, "Served orders show up here.")}
      </div>
    </div>
  );
}