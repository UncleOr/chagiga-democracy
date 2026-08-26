import Link from "next/link";
import { getAllRounds, getRoundData, getAdminBids, currentPots, hasResults } from "@/lib/data";
import { createRound, updateRound, setRoundStatus, settleRound } from "@/lib/actions/admin";
import { ils, statusLabel, dateHe } from "@/lib/format";
import type { Round } from "@/lib/types";

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ round?: string }>;
}) {
  const { round: roundParam } = await searchParams;
  const rounds = await getAllRounds();
  const selected: Round | undefined = rounds.find((r) => r.id === roundParam) ?? rounds[0];

  return (
    <div className="space-y-5">
      {/* Round selector + create */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold">סבבים</h2>
          <form action={createRound} className="flex gap-2">
            <input name="name" placeholder="שם סבב חדש" className="input w-48" />
            <button className="btn-ghost">+ סבב</button>
          </form>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {rounds.length === 0 && <p className="text-sm text-slate-400">אין סבבים עדיין.</p>}
          {rounds.map((r) => (
            <Link
              key={r.id}
              href={`/admin?round=${r.id}`}
              className={`chip ${
                selected?.id === r.id ? "border-brand-400 bg-brand-50 text-brand-700" : "border-slate-200"
              }`}
            >
              {r.name} · {statusLabel(r.status)}
            </Link>
          ))}
        </div>
      </div>

      {selected && <RoundPanel round={selected} />}
    </div>
  );
}

async function RoundPanel({ round }: { round: Round }) {
  const [data, adminBids] = await Promise.all([getRoundData(round.id), getAdminBids(round.id)]);
  const pots = data ? currentPots(data) : null;
  const resultsReady = data ? hasResults(data.parties) : false;
  const pending = adminBids.filter((b) => !b.paid && b.payment_claimed).length;

  return (
    <>
      {/* Status controls */}
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">מצב הסבב: {statusLabel(round.status)}</h2>
          {pending > 0 && (
            <Link href={`/admin/payments?round=${round.id}`} className="badge bg-amber-100 text-amber-700">
              {pending} תשלומים לאישור
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {round.status !== "open" && (
            <StatusButton id={round.id} status="open" label="פתיחת הימורים" cls="btn-primary" />
          )}
          {round.status === "open" && (
            <StatusButton id={round.id} status="closed" label="סגירת הימורים" cls="btn-gold" />
          )}
          {round.status === "closed" && (
            <SettleButton id={round.id} disabled={!resultsReady} />
          )}
          {round.status === "settled" && (
            <StatusButton id={round.id} status="closed" label="ביטול פרסום תוצאות" cls="btn-ghost" />
          )}
          {round.status !== "draft" && round.status !== "settled" && (
            <StatusButton id={round.id} status="draft" label="החזרה לטיוטה" cls="btn-ghost" />
          )}
        </div>
        {round.status === "closed" && !resultsReady && (
          <p className="mt-3 text-sm text-amber-600">
            להזנת התוצאות עברו ללשונית <b>תוצאות</b>. אי אפשר לפרסם תוצאות סופיות לפני הזנתן.
          </p>
        )}
        <div className="mt-3 border-t border-slate-100 pt-3">
          <a href={`/admin/export?round=${round.id}`} className="text-sm font-semibold text-brand-600 hover:underline">
            ⬇ ייצוא לאקסל (CSV) — כל ההימורים, הפסילות והזכיות
          </a>
        </div>
      </div>

      {/* Quick stats */}
      {pots && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="משתתפים פעילים" value={pots.participants.toString()} />
          <Stat label="סה״כ בקופה" value={ils(pots.total)} />
          <Stat label="קופת מנדטים / זהב" value={ils(pots.mandatePot)} />
          <Stat label="צלפים / עוברת" value={`${ils(pots.sniperPot)} · ${ils(pots.passfailPot)}`} />
        </div>
      )}

      {/* Settings */}
      <form action={updateRound} className="card space-y-4 p-5">
        <input type="hidden" name="id" value={round.id} />
        <h2 className="font-bold">הגדרות הסבב</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="שם הסבב" name="name" defaultValue={round.name} />
          <Field
            label="מועד נעילה אוטומטי (המועד הקובע)"
            name="closes_at"
            type="datetime-local"
            defaultValue={toLocalInput(round.closes_at)}
          />
          <Field label="קישור PayBox" name="paybox_url" defaultValue={round.paybox_url ?? ""} placeholder="https://payboxapp.page.link/..." />
          <Field label="סף מעבר (מנדטים)" name="threshold_pct" type="number" step="1" defaultValue={round.threshold_pct} />
          <Field label="הימור בסיסי (₪)" name="base_bet" type="number" defaultValue={round.base_bet} />
          <Field label="עלות הכפלה (₪)" name="double_cost" type="number" defaultValue={round.double_cost} />
          <Field label="עלות בונוס צלפים (₪)" name="sniper_cost" type="number" defaultValue={round.sniper_cost} />
          <Field label="עלות עוברת או לא (₪)" name="passfail_cost" type="number" defaultValue={round.passfail_cost} />
          <Field label="הימור זהב — מקום 1" name="gold_first_pct" type="number" step="0.01" defaultValue={round.gold_first_pct} />
          <Field label="הימור זהב — מקום 2" name="gold_second_pct" type="number" step="0.01" defaultValue={round.gold_second_pct} />
          <Field label="צלפים — מקום 1" name="sniper_first_pct" type="number" step="0.01" defaultValue={round.sniper_first_pct} />
          <Field label="צלפים — מקום 2" name="sniper_second_pct" type="number" step="0.01" defaultValue={round.sniper_second_pct} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">נוצר: {dateHe(round.created_at)}</span>
          <button className="btn-primary">שמירת הגדרות</button>
        </div>
      </form>
    </>
  );
}

function StatusButton({ id, status, label, cls }: { id: string; status: any; label: string; cls: string }) {
  return (
    <form action={setRoundStatus.bind(null, id, status)}>
      <button className={cls}>{label}</button>
    </form>
  );
}

function SettleButton({ id, disabled }: { id: string; disabled: boolean }) {
  return (
    <form action={settleRound.bind(null, id)}>
      <button className="btn-primary" disabled={disabled}>
        פרסום תוצאות סופיות
      </button>
    </form>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-extrabold">{value}</div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  step,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  step?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input name={name} type={type} step={step} defaultValue={defaultValue} placeholder={placeholder} className="input" />
    </div>
  );
}
