"use client";

import { useEffect, useState } from "react";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

const UNITS: { key: "days" | "hours" | "minutes" | "seconds"; label: string }[] = [
  { key: "days", label: "ימים" },
  { key: "hours", label: "שעות" },
  { key: "minutes", label: "דקות" },
  { key: "seconds", label: "שניות" },
];

export function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Avoid SSR/client mismatch: nothing until mounted.
  if (now === null) return <div className="h-[52px]" aria-hidden />;

  const end = new Date(target).getTime();
  const diff = end - now;

  if (diff <= 0) {
    return (
      <div className="text-center text-sm font-bold opacity-80">⏳ ההימורים ננעלים ברגעים אלו…</div>
    );
  }

  const p = parts(diff);
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide opacity-70">נסגר בעוד</span>
      <div className="flex items-center gap-1.5" dir="ltr">
        {UNITS.map((u, i) => (
          <div key={u.key} className="flex items-center gap-1.5">
            <div className="flex min-w-[2.75rem] flex-col items-center rounded-xl bg-white/70 px-2 py-1 shadow-sm ring-1 ring-black/5">
              <span className="text-xl font-extrabold tabular-nums leading-none">
                {String(p[u.key]).padStart(2, "0")}
              </span>
              <span className="mt-0.5 text-[10px] font-medium opacity-60">{u.label}</span>
            </div>
            {i < UNITS.length - 1 && <span className="text-lg font-bold opacity-30">:</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
