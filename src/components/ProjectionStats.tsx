"use client";

import { useState } from "react";
import { ilsShort } from "@/lib/format";
import type { PollMetrics, WinBreakdown, PartyCompare } from "@/lib/data";

type Key = "poll" | "perfect" | "similar" | "different";

export function ProjectionStats({ metrics }: { metrics: PollMetrics }) {
  const [open, setOpen] = useState<Key | null>(null);
  const toggle = (k: Key) => setOpen((cur) => (cur === k ? null : k));

  const tile = (k: Key, label: string, value: string, accent?: boolean) => (
    <button
      onClick={() => toggle(k)}
      className={`rounded-xl px-3 py-2 text-right transition ${
        open === k ? "ring-2 ring-brand-300" : ""
      } ${accent ? "bg-brand-50 hover:bg-brand-100" : "bg-slate-50 hover:bg-slate-100"}`}
    >
      <div className="flex items-center justify-between gap-1 text-[11px] leading-tight text-slate-500">
        <span>{label}</span>
        <span className="text-slate-300">ⓘ</span>
      </div>
      <div className={`mt-0.5 truncate text-sm font-extrabold ${accent ? "text-brand-700" : "text-slate-700"}`}>
        {value}
      </div>
    </button>
  );

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tile("poll", "זכייה אם התוצאות כמו הסקרים", ilsShort(metrics.pollTotal), true)}
        {tile("perfect", "זכייה אם היית מנחש בול", ilsShort(metrics.perfectTotal), true)}
        {tile("similar", "הכי דומה לכולם", metrics.mostSimilar ?? "—")}
        {tile("different", "הכי שונה מכולם", metrics.mostDifferent ?? "—")}
      </div>

      {open && (
        <div className="mt-2 animate-[fadeIn_.2s_ease] rounded-xl border border-brand-100 bg-white p-3 text-sm">
          {open === "poll" && <Breakdown title="מרכיבי הזכייה (לפי הסקרים)" b={metrics.pollBreakdown} total={metrics.pollTotal} />}
          {open === "perfect" && (
            <Breakdown title="מרכיבי הזכייה (אם ניחשת בול)" b={metrics.perfectBreakdown} total={metrics.perfectTotal} />
          )}
          {open === "similar" && <Compare c={metrics.similar} kind="similar" />}
          {open === "different" && <Compare c={metrics.different} kind="different" />}
        </div>
      )}
    </div>
  );
}

function Breakdown({ title, b, total }: { title: string; b: WinBreakdown; total: number }) {
  const rows: [string, number][] = [
    ["קופת מנדטים", b.mandate],
    ["הימור זהב", b.gold],
    ["בונוס צלפים", b.sniper],
    ["עוברת או לא", b.passfail],
  ];
  if (total <= 0) return <p className="text-slate-500">בתרחיש הזה ההימור הזה לא זוכה בכלום.</p>;
  return (
    <div>
      <div className="mb-2 font-bold text-slate-600">{title}</div>
      <div className="space-y-1">
        {rows.map(([label, v]) => (
          <div key={label} className={`flex justify-between ${v > 0 ? "" : "text-slate-300"}`}>
            <span>{label}</span>
            <span className="font-semibold tabular-nums">{ilsShort(v)}</span>
          </div>
        ))}
        <div className="mt-1 flex justify-between border-t border-slate-100 pt-1 font-extrabold text-brand-700">
          <span>סה"כ</span>
          <span className="tabular-nums">{ilsShort(total)}</span>
        </div>
      </div>
    </div>
  );
}

function Compare({ c, kind }: { c: PartyCompare | null; kind: "similar" | "different" }) {
  if (!c) return <p className="text-slate-500">אין מספיק נתונים.</p>;
  return (
    <div className="space-y-1.5">
      <div className="font-bold text-slate-600">
        {kind === "similar" ? "הכי דומה לכולם:" : "הכי שונה מכולם:"} {c.party}
      </div>
      <div className="flex justify-between">
        <span className="text-slate-500">הניחוש שלך</span>
        <span className="font-semibold tabular-nums">{c.mine} מנדטים</span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-500">הממוצע של כולם</span>
        <span className="font-semibold tabular-nums">{c.avg.toFixed(1)} מנדטים</span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-500">ניחשו בדיוק כמוך</span>
        <span className="font-semibold tabular-nums">
          {c.samePct}% <span className="text-slate-400">מתוך {c.count}</span>
        </span>
      </div>
    </div>
  );
}
