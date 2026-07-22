import { getAllRounds, getParties } from "@/lib/data";
import { saveResults } from "@/lib/actions/admin";

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

  return (
    <form action={saveResults} className="space-y-4">
      <input type="hidden" name="round_id" value={round.id} />
      <div className="flex items-center justify-between">
        <h2 className="font-bold">הזנת תוצאות · {round.name}</h2>
        <span className="badge bg-slate-100 text-slate-600">סה״כ מנדטים: {total}</span>
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
          שמירה מעדכנת מיד את טבלת הדירוג. פרסום תוצאות סופיות (וחלוקת הכסף) מתבצע בלשונית “סבב והגדרות”.
        </p>
        <button className="btn-primary">שמירת תוצאות</button>
      </div>
    </form>
  );
}
