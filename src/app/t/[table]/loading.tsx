export default function Loading() {
  return (
    <main className="animate-pulse">
      <div className="h-72 bg-espresso/90" />
      <div className="mx-auto max-w-3xl space-y-4 px-4 pt-8">
        <div className="h-8 w-40 rounded-lg bg-latte" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-latte/70" />
        ))}
      </div>
    </main>
  );
}