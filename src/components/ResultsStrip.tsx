import type { Party } from "@/lib/types";

export function ResultsStrip({ parties }: { parties: Party[] }) {
  const withSeats = parties.filter((p) => p.actual_seats !== null);
  if (withSeats.length === 0) return null;
  return (
    <div className="card p-4">
      <div className="mb-3 text-sm font-bold text-slate-600">תוצאות הבחירות</div>
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
