import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";
import PrintButton from "./PrintButton";
import RegenButton from "./RegenButton";

export const dynamic = "force-dynamic";

async function siteUrl() {
  const env = process.env.SITE_URL?.replace(/\/$/, "");
  if (env) return env;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto =
    h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function TablesPage({
  searchParams,
}: {
  searchParams: Promise<{ only?: string }>;
}) {
  const { only } = await searchParams;
  const onlyNo = Number(only);

  const { data } = await supabase
    .from("cafe_tables")
    .select("number, token")
    .order("number");
  const all = (data ?? []) as { number: number; token: string }[];
  const shown = Number.isInteger(onlyNo) ? all.filter((t) => t.number === onlyNo) : all;
  const base = await siteUrl();

  const cards = await Promise.all(
    shown.map(async (t) => {
      const url = `${base}/t/${t.number}?k=${t.token}`;
      const qr = await QRCode.toDataURL(url, {
        width: 700,
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#2B1B14", light: "#FFFFFF" },
      });
      return { ...t, url, qr };
    })
  );

  return (
    <div className="space-y-6">
      <div className="space-y-3 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl text-espresso">Tables & QR codes</h1>
            <p className="text-sm text-mocha">
              Print these and place one on each table. Guests scan to open the menu.
            </p>
          </div>
          <PrintButton />
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/tables"
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              !Number.isInteger(onlyNo) ? "bg-espresso text-cream" : "bg-latte text-mocha"
            }`}
          >
            All tables
          </Link>
          {all.map((t) => (
            <Link
              key={t.number}
              href={`/admin/tables?only=${t.number}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                onlyNo === t.number ? "bg-espresso text-cream" : "bg-latte text-mocha"
              }`}
            >
              Table {t.number}
            </Link>
          ))}
        </div>

        {base.includes("localhost") && (
          <p className="rounded-xl bg-caramel/15 px-4 py-2 text-sm text-mocha">
            These QR codes point to <b>{base}</b>, which only works on this
            computer. Set <code>SITE_URL</code> to your real website address
            before printing the final cards.
          </p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 print:block">
        {cards.map((c) => (
          <div
            key={c.number}
            className="mx-auto flex w-full max-w-sm break-inside-avoid break-after-page flex-col items-center rounded-3xl border-2 border-espresso bg-white p-8 text-center print:mt-10 print:max-w-md"
          >
            <Image
              src="/logo.png"
              alt="VareqonTech"
              width={170}
              height={85}
              style={{ height: "auto" }}
            />
            <p className="mt-4 text-sm uppercase tracking-widest text-mocha">Table</p>
            <p className="font-display text-8xl leading-none text-espresso">
              {c.number}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.qr}
              alt={`QR code for table ${c.number}`}
              className="mt-5 h-60 w-60"
            />
            <p className="mt-4 font-display text-xl text-espresso">
              Scan to view menu & order
            </p>
            <p className="mt-1 text-sm text-mocha">
              Your food will be brought to your table
            </p>

            <div className="mt-4 w-full border-t border-latte pt-3 print:hidden">
              <p className="break-all text-xs text-mocha">{c.url}</p>
              <div className="mt-2 flex justify-center gap-2">
                <a
                  href={c.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-latte px-3 py-1 text-sm font-medium text-mocha"
                >
                  Open link
                </a>
                <RegenButton table={c.number} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}