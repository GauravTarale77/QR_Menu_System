import Image from "next/image";
import Link from "next/link";
import { fetchOrder } from "@/lib/orders";
import OrderTracker from "@/components/OrderTracker";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ table: string; id: string }>;
  searchParams: Promise<{ k?: string }>;
}) {
  const { table, id } = await params;
  const { k } = await searchParams;
  const tableNo = Number(table);

  const order = k ? await fetchOrder(id, tableNo, k) : null;

  if (!order || !k) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="font-display text-3xl text-espresso">Order not found</h1>
        <p className="text-mocha">Please scan the QR code on your table again.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 pb-16 pt-8">
      <div className="mb-6 flex justify-center">
        <Image src="/logo.png" alt="VareqonTech" width={150} height={75} priority />
      </div>
      <OrderTracker initial={order} table={tableNo} token={k} />
      <div className="mt-8 text-center">
        <Link
          href={`/t/${tableNo}?k=${k}`}
          className="font-medium text-mocha underline underline-offset-4"
        >
          ← Back to menu
        </Link>
      </div>
    </main>
  );
}