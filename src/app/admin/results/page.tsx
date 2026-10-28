import { getAllRounds, getParties } from "@/lib/data";
import { saveResults } from "@/lib/actions/admin";
import { dateTimeHe, resultsModeLabel } from "@/lib/format";

export default async function AdminResults({
  searchParams,
}: {
  searchParams: Promise<{ round?: string }>;
}) {
  const { round: roundParam } = await searchParams;
  const rounds = await getAllRounds();
  const round = rounds.find((r) => r.id === roundParam) ?? rounds[0];
  if (!round) return <p className="text-sm text-slate-400">אין סבב.</p>;

  const parties = await getParties(round.id);
  const total = parties.reduce((s, p) => s + (p.actual_seats ?? 0), 0);
  const resultsExist = parties.some((p) => p.actual_seats !== null);
  const mode = round.results_mode;
  const current = resultsModeLabel(mode, round.results_pct);

  const MODES = [
    { key: "samples", label: "ממוצע מדגמים", hint: "ממוצע כל הסקרים — הערכה, לא סופי" },
    { key: "live", label: "אחוז מתוצאות אמת", hint: "ספירה חלקית — עם אחוז הקולות שנספרו" },
    { key: "final", label: "תוצאות סופיות", hint: "התוצאות הרשמיות — מפרסם את חלוקת הזכיות" },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Current state indicator */}
      <div className="card p-4">
        {resultsExist ? (
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`badge ${
                current.final ? "bg-brand-50 text-brand-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {current.final ? "🏆" : "⏳"} {current.title} · {current.badge}
            </span>
            {round.results_updated_at && (
              <span className="text-xs text-slate-400">עודכן {dateTimeHe(round.results_updated_at)}</span>
            )}
          </div>
        ) : (
          <span className="text-sm text-slate-400">עדיין לא הוזנו תוצאות. שמרו מנדטים כדי להציג מצב לכולם.</span>
        )}
        <p className="mt-2 text-xs text-slate-400">
          כל שמירה מעדכנת מיד לכולם את הדירוג, הזכיות, הסטטוס (ממוצע מדגמים / אחוז אמת / סופי) ושעת העדכון.
        </p>
      </div>

      <form action={saveResults} className="space-y-4">
        <input type="hidden" name="round_id" value={round.id} />

        <div className="flex items-center justify-between">
          <h2 className="font-bold">הזנת תוצאות · {round.name}</h2>
          <span className="badge bg-slate-100 text-slate-600">סה״כ מנדטים: {total}</span>
        </div>

        {/* Results mode selector */}
        <div className="card space-y-3 p-4">
          <label className="label text-xs">סוג התוצאות (מוצג לכולם)</label>
          <div className="grid gap-2 sm:grid-cols-3">
            {MODES.map((m) => (
              <label
                key={m.key}
                className="chip cursor-pointer flex-col !items-start gap-0.5 border-slate-200 p-3 has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50"
              >
                <span className="flex items-center gap-2 font-semibold">
                  <input
                    type="radio"
                    name="results_mode"
                    value={m.key}
                    defaultChecked={mode === m.key}
                    className="accent-brand-600"
                  />
                  {m.label}
                </span>
                <span className="text-[11px] text-slate-400">{m.hint}</span>
              </label>
            ))}
          </div>
          <div>
            <label className="label text-xs">אחוז הקולות שנספרו (לסוג “אחוז מתוצאות אמת”)</label>
            <div className="flex items-center gap-2">
              <input
                name="results_pct"
                type="number"
                min={0}
                max={100}
                step={0.1}
                defaultValue={round.results_pct ?? ""}
                placeholder="לדוגמה 87.5"
                className="input w-32 text-center"
              />
              <span className="text-sm text-slate-400">%</span>
            </div>
          </div>
        </div>

        <div className="card divide-y divide-slate-100">
          {parties.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 p-3">
              <span className="flex-1 font-medium">
                {p.nickname}
                {p.is_swing && <span className="badge mr-2 bg-brand-50 text-brand-600">מתנדנדת</span>}
              </span>
              <div>
                <label className="label text-xs">מנדטים בפועל</label>
                <input
                  name={`seats_${p.id}`}
                  type="number"
                  min={0}
                  defaultValue={p.actual_seats ?? ""}
                  placeholder="—"
                  className="input w-24 text-center"
                />
              </div>
              {p.is_swing && (
                <div className="flex gap-1">
                  {(["pass", "fail"] as const).map((v) => (
                    <label
                      key={v}
                      className="chip cursor-pointer border-slate-200 has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50"
                    >
                      <input
                        type="radio"
                        name={`pass_${p.id}`}
                        value={v}
                        defaultChecked={p.actual_passed === (v === "pass")}
                        className="accent-brand-600"
                      />
                      {v === "pass" ? "עברה" : "לא עברה"}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">
            בחירת “תוצאות סופיות” ושמירה — מפרסמת את החלוקה ומסמנת זכייה סופית. אפשר לחזור לזמני בכל רגע.
          </p>
          <button className="btn-primary">שמירת תוצאות</button>
        </div>
      </form>
    </div>
  );
}
