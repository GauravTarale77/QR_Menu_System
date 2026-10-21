import { BRAND } from "@/config/brand";

export default function Footer() {
  return (
    <footer className="mx-auto mt-14 max-w-3xl px-4 text-center text-sm text-mocha">
      <p className="font-display text-lg text-espresso">{BRAND.name}</p>
      {BRAND.address && <p>{BRAND.address}</p>}
      {BRAND.phone && <p>{BRAND.phone}</p>}
      <p className="mt-3 text-xs">Thank you for dining with us ☕</p>
    </footer>
  );
}