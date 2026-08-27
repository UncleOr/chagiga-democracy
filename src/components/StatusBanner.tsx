import Link from "next/link";
import { dateHe, statusLabel } from "@/lib/format";
import type { Round } from "@/lib/types";

export function StatusBanner({ round, isLoggedIn }: { round: Round; isLoggedIn?: boolean }) {
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
    <div className={`rounded-2xl border px-4 py-4 ${map[round.status]}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="flex items-center gap-2 text-lg font-extrabold">
            <span className={`h-2.5 w-2.5 animate-pulse rounded-full ${dot[round.status]}`} />
            {statusLabel(round.status)}
          </span>
          {round.status === "open" && round.closes_at && (
            <span className="mt-0.5 block text-sm opacity-80">ההימורים ננעלים ב־{dateHe(round.closes_at)}</span>
          )}
          {round.status === "closed" && (
            <span className="mt-0.5 block text-sm opacity-80">ממתינים לתוצאות הבחירות…</span>
          )}
          {round.status === "settled" && (
            <span className="mt-0.5 block text-sm opacity-80">התוצאות הסופיות פורסמו 🎉</span>
          )}
        </div>
        {round.status === "open" && (
          <Link
            href={isLoggedIn ? "/bet" : "/login?next=/bet"}
            className="btn-primary w-full py-3 text-base sm:w-auto"
          >
            {isLoggedIn ? "להימור →" : "התחברו והמרו →"}
          </Link>
        )}
      </div>
    </div>
  );
}
