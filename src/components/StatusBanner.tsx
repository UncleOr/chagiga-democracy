import { dateHe, statusLabel } from "@/lib/format";
import type { Round } from "@/lib/types";

export function StatusBanner({ round }: { round: Round }) {
  const map: Record<string, string> = {
    open: "border-green-200 bg-green-50 text-green-800",
    closed: "border-amber-200 bg-amber-50 text-amber-800",
    settled: "border-brand-200 bg-brand-50 text-brand-800",
    draft: "border-slate-200 bg-slate-50 text-slate-700",
  };
  const dot: Record<string, string> = {
    open: "bg-green-500",
    closed: "bg-amber-500",
    settled: "bg-brand-500",
    draft: "bg-slate-400",
  };
  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-3 ${map[round.status]}`}>
      <span className="flex items-center gap-2 font-bold">
        <span className={`h-2.5 w-2.5 animate-pulse rounded-full ${dot[round.status]}`} />
        {statusLabel(round.status)}
      </span>
      {round.status === "open" && round.closes_at && (
        <span className="text-sm">ההימורים ננעלים ב־{dateHe(round.closes_at)}</span>
      )}
      {round.status === "closed" && <span className="text-sm">ממתינים לתוצאות הבחירות…</span>}
    </div>
  );
}
