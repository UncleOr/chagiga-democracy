import Link from "next/link";
import { getAllRounds, getParties } from "@/lib/data";
import { upsertParty, deleteParty } from "@/lib/actions/admin";
import { BLOCS, type BlocKey } from "@/lib/types";

function BlocSelect({ value }: { value: BlocKey | null }) {
  return (
    <div className="min-w-[8rem]">
      <label className="label text-xs">גוש</label>
      <select name="bloc" defaultValue={value ?? ""} className="input">
        <option value="">— ללא —</option>
        {BLOCS.map((b) => (
          <option key={b.key} value={b.key}>
            {b.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default async function AdminParties({
  searchParams,
}: {
  searchParams: Promise<{ round?: string }>;
}) {
  const { round: roundParam } = await searchParams;
  const rounds = await getAllRounds();
  const round = rounds.find((r) => r.id === roundParam) ?? rounds[0];
  if (!round) return <p className="text-sm text-slate-400">אין סבב. צרו סבב תחילה.</p>;

  const parties = await getParties(round.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">מפלגות · {round.name}</h2>
        <span className="text-sm text-slate-400">{parties.length} מפלגות</span>
      </div>

      <div className="card divide-y divide-slate-100">
        {parties.map((p) => (
          <div key={p.id} className="flex flex-wrap items-end gap-2 p-3">
            <form action={upsertParty} className="flex flex-1 flex-wrap items-end gap-2">
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="round_id" value={round.id} />
              <div className="w-14">
                <label className="label text-xs">סדר</label>
                <input name="display_order" type="number" defaultValue={p.display_order} className="input text-center" />
              </div>
              <div className="min-w-[10rem] flex-1">
                <label className="label text-xs">שם מלא</label>
                <input name="name" defaultValue={p.name} className="input" />
              </div>
              <div className="min-w-[8rem] flex-1">
                <label className="label text-xs">כינוי בטבלה</label>
                <input name="nickname" defaultValue={p.nickname} className="input" />
              </div>
              <BlocSelect value={p.bloc} />
              <div className="w-20">
                <label className="label text-xs">סקר</label>
                <input name="poll_seats" type="number" defaultValue={p.poll_seats ?? ""} placeholder="—" className="input text-center" />
              </div>
              <label className="chip mb-1 cursor-pointer border-slate-200">
                <input type="checkbox" name="is_swing" defaultChecked={p.is_swing} className="accent-brand-600" />
                מתנדנדת
              </label>
              <button className="btn-ghost mb-0.5">שמירה</button>
            </form>
            <DeleteButton id={p.id} />
          </div>
        ))}
        {parties.length === 0 && <p className="p-4 text-sm text-slate-400">אין מפלגות. הוסיפו למטה.</p>}
      </div>

      {/* Add new */}
      <form action={upsertParty} className="card flex flex-wrap items-end gap-2 p-3">
        <input type="hidden" name="round_id" value={round.id} />
        <div className="w-14">
          <label className="label text-xs">סדר</label>
          <input name="display_order" type="number" defaultValue={parties.length + 1} className="input text-center" />
        </div>
        <div className="min-w-[10rem] flex-1">
          <label className="label text-xs">שם מלא</label>
          <input name="name" placeholder="שם המפלגה" className="input" />
        </div>
        <div className="min-w-[8rem] flex-1">
          <label className="label text-xs">כינוי בטבלה</label>
          <input name="nickname" placeholder="כינוי קצר" className="input" />
        </div>
        <BlocSelect value={null} />
        <div className="w-20">
          <label className="label text-xs">סקר</label>
          <input name="poll_seats" type="number" placeholder="—" className="input text-center" />
        </div>
        <label className="chip mb-1 cursor-pointer border-slate-200">
          <input type="checkbox" name="is_swing" className="accent-brand-600" />
          מתנדנדת
        </label>
        <button className="btn-primary mb-0.5">+ הוספה</button>
      </form>

      <p className="text-xs text-slate-400">
        “מתנדנדת” = מפלגה שמשתתפת במשחק “עוברת או לא”. ניתן להוסיף/להסיר מפלגות בכל שלב (תקנון 3.4.3).
      </p>
      <Link href={`/admin/results?round=${round.id}`} className="btn-ghost">
        להזנת תוצאות ←
      </Link>
    </div>
  );
}

function DeleteButton({ id }: { id: string }) {
  return (
    <form action={deleteParty.bind(null, id)} className="mb-0.5">
      <button className="btn-ghost border-red-200 text-red-500 hover:bg-red-50">מחיקה</button>
    </form>
  );
}
