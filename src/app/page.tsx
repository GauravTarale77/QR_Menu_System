import Image from "next/image";
import { BRAND } from "@/config/brand";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <Image
        src={BRAND.logo}
        alt={BRAND.shortName}
        width={200}
        height={100}
        priority
        style={{ height: "auto" }}
      />
      <h1 className="font-display text-3xl text-espresso">Welcome to {BRAND.name}</h1>
      <p className="max-w-sm text-mocha">
        Please scan the QR code on your table to view the menu and place your order.
      </p>
    </main>
  );
}