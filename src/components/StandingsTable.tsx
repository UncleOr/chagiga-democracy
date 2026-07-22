import { ilsShort } from "@/lib/format";

export interface StandingRow {
  nickname: string;
  is_double: boolean;
  has_sniper: boolean;
  has_passfail: boolean;
  paid: boolean;
  frozen: boolean;
  totalDelta?: number;
  snipes?: number;
  correctPassfail?: number;
  total?: number;
}

export function StandingsTable({
  rows,
  showResults,
  showWinnings,
}: {
  rows: StandingRow[];
  showResults: boolean;
  showWinnings: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="card p-8 text-center text-slate-400">עדיין אין משתתפים פעילים בסבב הזה.</div>
    );
  }
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-right text-xs text-slate-400">
              <th className="px-3 py-3 font-medium">#</th>
              <th className="px-3 py-3 font-medium">כינוי</th>
              <th className="px-3 py-3 font-medium">תוספות</th>
              {showResults && <th className="px-3 py-3 font-medium">פסילות</th>}
              {showResults && <th className="px-3 py-3 font-medium">צליפות</th>}
              {showWinnings && <th className="px-3 py-3 text-left font-medium">זכייה</th>}
              {!showWinnings && <th className="px-3 py-3 font-medium">תשלום</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={`${r.nickname}-${i}`}
                className={`border-b border-slate-50 ${i < 3 && showResults ? "bg-gold-400/5" : ""}`}
              >
                <td className="px-3 py-3 font-bold text-slate-400">
                  {showResults ? medal(i) : i + 1}
                </td>
                <td className="px-3 py-3 font-semibold">
                  <span className="flex items-center gap-2">
                    {r.nickname}
                    {r.frozen && (
                      <span className="badge bg-amber-100 text-amber-700" title="הימור מוקפא">
                        מוקפא
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className="flex flex-wrap gap-1">
                    {r.is_double && <span className="badge bg-brand-50 text-brand-600">×2</span>}
                    {r.has_sniper && <span className="badge bg-gold-400/15 text-gold-600">🎯</span>}
                    {r.has_passfail && <span className="badge bg-slate-100 text-slate-500">עו/לא</span>}
                    {!r.is_double && !r.has_sniper && !r.has_passfail && (
                      <span className="text-slate-300">—</span>
                    )}
                  </span>
                </td>
                {showResults && <td className="px-3 py-3 tabular-nums">{r.totalDelta ?? "—"}</td>}
                {showResults && (
                  <td className="px-3 py-3 tabular-nums">{r.has_sniper ? r.snipes ?? 0 : "—"}</td>
                )}
                {showWinnings && (
                  <td className="px-3 py-3 text-left font-extrabold text-brand-700 tabular-nums">
                    {ilsShort(r.total ?? 0)}
                  </td>
                )}
                {!showWinnings && (
                  <td className="px-3 py-3">
                    {r.paid ? (
                      <span className="badge bg-green-100 text-green-700">שולם</span>
                    ) : (
                      <span className="badge bg-slate-100 text-slate-400">ממתין</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function medal(i: number): string {
  return ["🥇", "🥈", "🥉"][i] ?? (i + 1).toString();
}
