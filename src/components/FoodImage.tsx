import Image from "next/image";

export default function FoodImage({
  src,
  alt,
  className = "",
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        aria-hidden
        className={`flex items-center justify-center bg-gradient-to-br from-latte to-caramel/40 text-4xl ${className}`}
      >
        ☕
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 50vw, 300px"
        className="object-cover"
      />
    </div>
  );
}