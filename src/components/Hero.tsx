import Image from "next/image";
import { BRAND } from "@/config/brand";

export default function Hero({ table }: { table: number }) {
  return (
    <header className="relative overflow-hidden bg-espresso px-4 pb-12 pt-8 text-center text-cream">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-caramel/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-mocha/50 blur-3xl"
      />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-4">
        <div className="fade-up rounded-2xl bg-white px-5 py-2 shadow-lg">
          <Image
            src={BRAND.logo}
            alt={BRAND.shortName}
            width={150}
            height={75}
            priority
            style={{ height: "auto" }}
          />
        </div>

        <span className="fade-up delay-1 rounded-full bg-caramel px-4 py-1 text-sm font-semibold text-white">
          Table {table}
        </span>

        <h1 className="fade-up delay-2 font-display text-4xl leading-tight sm:text-5xl">
          {BRAND.welcome}
        </h1>
        <p className="fade-up delay-3 text-latte">{BRAND.tagline}</p>

        {(BRAND.hours || BRAND.address) && (
          <p className="fade-up delay-3 text-xs text-latte/80">
            {[BRAND.hours, BRAND.address].filter(Boolean).join("  ·  ")}
          </p>
        )}
      </div>
    </header>
  );
}