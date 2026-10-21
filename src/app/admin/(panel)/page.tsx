import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { rupees } from "@/lib/format";
import { IST_MS, istDayStart } from "@/lib/time";
import CleanupButton from "./CleanupButton";

export const dynamic = "force-dynamic";

const RANGES = {
  today: { label: "Today", days: 0 },
  "7d": { label: "Last 7 days", days: 6 },
  "30d": { label: "Last 30 days", days: 29 },
} as const;
type RangeKey = keyof typeof RANGES;

type DailyRow = { day_date: string; day_total: number; day_orders: number };
type TopRow = { item_name: string; qty: number; revenue: number };

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const key: RangeKey = range === "7d" || range === "30d" ? range : "today";
  const from = istDayStart(RANGES[key].days).toISOString();
  const chartFrom = istDayStart(13).toISOString();

  const [sum, top, daily, rating, history] = await Promise.all([
    supabase.rpc("sales_summary", { from_ts: from }),
    supabase.rpc("top_items", { from_ts: from, max_rows: 8 }),
    supabase.rpc("daily_totals", { from_ts: chartFrom }),
    supabase.rpc("rating_summary", { from_ts: from }),
    supabase.from("daily_sales").select("*").order("day", { ascending: false }).limit(400),
  ]);

  const s = (sum.data?.[0] ?? {}) as {
    total_sales?: number;
    order_count?: number;
    pending_amount?: number;
  };
  const totalSales = Number(s.total_sales ?? 0);
  const orderCount = Number(s.order_count ?? 0);
  const pendingAmount = Number(s.pending_amount ?? 0);
  const avgOrder = orderCount ? Math.round(totalSales / orderCount) : 0;

  const topItems = ((top.data ?? []) as TopRow[]).map((t) => ({
    name: t.item_name,
    qty: Number(t.qty),
    revenue: Number(t.revenue),
  }));
  const maxQty = topItems[0]?.qty ?? 1;

  const r = (rating.data?.[0] ?? {}) as { avg_rating?: number; review_count?: number };
  const reviewCount = Number(r.review_count ?? 0);

  // last 14 days chart (missing days = 0)
  const dailyMap = new Map<string, { total: number; orders: number }>();
  for (const row of (daily.data ?? []) as DailyRow[]) {
    dailyMap.set(row.day_date, {
      total: Number(row.day_total),
      orders: Number(row.day_orders),
    });
  }
  const days = Array.from({ length: 14 }, (_, i) => {
    const iso = new Date(istDayStart(13 - i).getTime() + IST_MS)
      .toISOString()
      .slice(0, 10);
    const v = dailyMap.get(iso);
    return {
      iso,
      total: v?.total ?? 0,
      orders: v?.orders ?? 0,
      label: new Date(iso + "T00:00:00Z").toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }),
    };
  });
  const maxDay = Math.max(1, ...days.map((d) => d.total));

  // monthly history from the saved daily totals
  const months = new Map<string, { total: number; orders: number }>();
  for (const row of (history.data ?? []) as {
    day: string;
    total_sales: number;
    order_count: number;
  }[]) {
    const m = row.day.slice(0, 7);
    const cur = months.get(m) ?? { total: 0, orders: 0 };
    cur.total += Number(row.total_sales);
    cur.orders += Number(row.order_count);
    months.set(m, cur);
  }

  const stat = (label: string, value: string, sub?: string) => (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-latte">
      <p className="text-sm text-mocha">{label}</p>
      <p className="mt-1 font-display text-3xl text-espresso">{value}</p>
      {sub && <p className="mt-1 text-xs text-mocha">{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-espresso">Sales dashboard</h1>
        <div className="flex gap-2">
          {(Object.keys(RANGES) as RangeKey[]).map((k) => (
            <Link
              key={k}
              href={k === "today" ? "/admin" : `/admin?range=${k}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                k === key ? "bg-espresso text-cream" : "bg-latte text-mocha"
              }`}
            >
              {RANGES[k].label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stat("Total sales", rupees(totalSales), "Cancelled orders not counted")}
        {stat("Orders", String(orderCount))}
        {stat("Average order", rupees(avgOrder))}
        {stat(
          "Customer rating",
          reviewCount ? `${Number(r.avg_rating).toFixed(1)} ★` : "–",
          `${reviewCount} review${reviewCount === 1 ? "" : "s"}`
        )}
      </div>

      {pendingAmount > 0 && (
        <p className="rounded-xl bg-caramel/15 px-4 py-2 text-sm text-mocha">
          {rupees(pendingAmount)} of these orders is still marked &quot;payment pending&quot;.
        </p>
      )}

      <section className="rounded-2xl bg-white p-4 ring-1 ring-latte">
        <h2 className="mb-3 font-display text-xl text-espresso">Sales, last 14 days</h2>
        <div className="flex h-44 items-end gap-1">
          {days.map((d) => (
            <div
              key={d.iso}
              title={`${d.label}: ${rupees(d.total)} (${d.orders} orders)`}
              className="flex h-full flex-1 flex-col items-center justify-end"
            >
              <div
                className="w-full rounded-t bg-caramel"
                style={{ height: `${Math.max(d.total ? 4 : 1, (d.total / maxDay) * 100)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-1">
          {days.map((d) => (
            <span key={d.iso} className="flex-1 text-center text-[10px] text-mocha">
              {d.iso.slice(8)}
            </span>
          ))}
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl bg-white p-4 ring-1 ring-latte">
          <h2 className="mb-3 font-display text-xl text-espresso">
            Most ordered · {RANGES[key].label.toLowerCase()}
          </h2>
          {topItems.length === 0 ? (
            <p className="text-sm text-mocha">No orders in this period yet.</p>
          ) : (
            <ul className="space-y-3">
              {topItems.map((t, i) => (
                <li key={t.name}>
                  <div className="flex justify-between text-sm">
                    <span className="text-espresso">
                      {i + 1}. {t.name}
                    </span>
                    <span className="text-mocha">
                      {t.qty} sold · {rupees(t.revenue)}
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-latte">
                    <div
                      className="h-2 rounded-full bg-leaf"
                      style={{ width: `${(t.qty / maxQty) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl bg-white p-4 ring-1 ring-latte">
          <h2 className="mb-3 font-display text-xl text-espresso">Monthly history</h2>
          {months.size === 0 ? (
            <p className="text-sm text-mocha">
              History appears after the first daily cleanup runs.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-mocha">
                  <th className="pb-2 font-medium">Month</th>
                  <th className="pb-2 font-medium">Orders</th>
                  <th className="pb-2 text-right font-medium">Sales</th>
                </tr>
              </thead>
              <tbody>
                {[...months.entries()].map(([m, v]) => (
                  <tr key={m} className="border-t border-latte">
                    <td className="py-2 text-espresso">
                      {new Date(m + "-01T00:00:00Z").toLocaleDateString("en-IN", {
                        month: "long",
                        year: "numeric",
                        timeZone: "UTC",
                      })}
                    </td>
                    <td className="py-2">{v.orders}</td>
                    <td className="py-2 text-right font-medium">{rupees(v.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="mt-3 text-xs text-mocha">
            Updated by the daily cleanup, so today&apos;s sales appear tomorrow.
          </p>
        </section>
      </div>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-latte">
        <p className="text-sm text-mocha">
          Detailed orders are kept for 30 days, then cleaned up automatically
          every night. Daily totals are kept.
        </p>
        <CleanupButton />
      </section>
    </div>
  );
}