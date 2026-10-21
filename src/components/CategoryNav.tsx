"use client";

import { useEffect, useState } from "react";

export default function CategoryNav({
  links,
}: {
  links: { id: string; label: string }[];
}) {
  const [active, setActive] = useState(links[0]?.id ?? "");

  useEffect(() => {
    const els = links
      .map((l) => document.getElementById(l.id))
      .filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-120px 0px -60% 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [links]);

  useEffect(() => {
    document
      .getElementById(`chip-${active}`)
      ?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [active]);

  return (
    <nav className="sticky top-0 z-20 border-b border-latte bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl gap-2 overflow-x-auto px-4 py-3">
        {links.map((l) => (
          <a
            key={l.id}
            id={`chip-${l.id}`}
            href={`#${l.id}`}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              active === l.id
                ? "border-mocha bg-mocha text-white"
                : "border-mocha/20 text-mocha hover:bg-mocha/10"
            }`}
          >
            {l.label}
          </a>
        ))}
      </div>
    </nav>
  );
}