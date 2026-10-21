"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-full bg-caramel px-5 py-2 font-semibold text-white shadow-sm"
    >
      🖨️ Print
    </button>
  );
}