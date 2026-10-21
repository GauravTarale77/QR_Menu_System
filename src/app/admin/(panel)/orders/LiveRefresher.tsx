"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

function beep() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    [880, 1175, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.28;
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.start(t);
      osc.stop(t + 0.22);
    });
  } catch {}
}

export default function LiveRefresher({ newCount }: { newCount: number }) {
  const router = useRouter();
  const [sound, setSound] = useState(false);
  const prev = useRef(newCount);

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = setInterval(refreshIfVisible, 15000);
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [router]);

  useEffect(() => {
    if (sound && newCount > prev.current) beep();
    prev.current = newCount;
  }, [newCount, sound]);

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span className="flex items-center gap-2 text-mocha">
        <span className="h-2 w-2 animate-pulse rounded-full bg-leaf" />
        Live · updates every 15 seconds
      </span>
      <button
        onClick={() => {
          const next = !sound;
          setSound(next);
          if (next) beep();
        }}
        className={`rounded-full px-4 py-1.5 font-medium ${
          sound ? "bg-leaf text-white" : "bg-latte text-mocha"
        }`}
      >
        {sound ? "🔔 Sound on" : "🔕 Enable sound alert"}
      </button>
    </div>
  );
}