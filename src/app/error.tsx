"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="font-display text-3xl text-espresso">Something went wrong</h1>
      <p className="text-mocha">Please try again. If it keeps happening, ask our staff.</p>
      <button
        onClick={() => reset()}
        className="rounded-full bg-caramel px-8 py-3 font-semibold text-white"
      >
        Try again
      </button>
    </main>
  );
}