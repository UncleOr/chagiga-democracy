import { BLOCS, type Party, type ResultsMode } from "@/lib/types";
import { dateTimeHe, resultsModeLabel } from "@/lib/format";

export function ResultsStrip({
  parties,
  mode = "samples",
  pct = null,
  updatedAt = null,
}: {
  parties: Party[];
  mode?: ResultsMode;
  pct?: number | null;
  updatedAt?: string | null;
}) {
  const withSeats = parties.filter((p) => p.actual_seats !== null);
  if (withSeats.length === 0) return null;
  const label = resultsModeLabel(mode, pct);

  // Bloc snapshot from the actual results.
  const blocSums: Record<string, number> = { coalition: 0, change: 0, arab: 0 };
  for (const p of withSeats) if (p.bloc) blocSums[p.bloc] += p.actual_seats ?? 0;
  const hasBlocs = Object.values(blocSums).some((v) => v > 0);
  return (
    <div className="card p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-600">
        {label.title}
        <span
          className={`badge ${label.final ? "bg-brand-50 text-brand-700" : "bg-amber-100 text-amber-700"}`}
        >
          {label.badge}
        </span>
        {updatedAt && (
          <span className="text-xs font-normal text-slate-400">עודכן {dateTimeHe(updatedAt)}</span>
        )}
      </div>
      {hasBlocs && (
        <div className="mb-3 grid gap-2 sm:grid-cols-3">
          {BLOCS.map((b) => (
            <div
              key={b.key}
              className="flex items-center justify-between rounded-xl border-r-4 bg-slate-50/70 px-3 py-2"
              style={{ borderColor: b.color }}
            >
              <span className="text-sm font-bold" style={{ color: b.color }}>
                {b.label}
              </span>
              <span className="text-lg font-extrabold tabular-nums" style={{ color: b.color }}>
                {blocSums[b.key]}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {withSeats.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-1.5"
          >
            <span className="text-sm font-medium">{p.nickname}</span>
            <span className="text-base font-extrabold tabular-nums">{p.actual_seats}</span>
            {p.is_swing && (
              <span
                className={`badge ${
                  p.actual_passed ? "bg-green-100 text-green-700" : "bg-red-50 text-red-500"
                }`}
              >
                {p.actual_passed ? "עברה" : "לא עברה"}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
