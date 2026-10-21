export default function VegMark({ veg }: { veg: boolean }) {
  const color = veg ? "border-leaf" : "border-red-600";
  const dot = veg ? "bg-leaf" : "bg-red-600";
  return (
    <span
      title={veg ? "Vegetarian" : "Non-vegetarian"}
      className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border-2 ${color}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
    </span>
  );
}