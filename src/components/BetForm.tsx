"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { submitBid } from "@/lib/actions/bid";
import { ilsShort } from "@/lib/format";
import type { Party, Round } from "@/lib/types";
import type { MyBid } from "@/lib/data";

const TOTAL_SEATS = 120;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full py-3 text-base">
      {pending ? "שומר..." : "שמירת ההימור"}
    </button>
  );
}

export function BetForm({
  round,
  parties,
  existing,
}: {
  round: Round;
  parties: Party[];
  existing: MyBid | null;
}) {
  const router = useRouter();
  const swing = parties.filter((p) => p.is_swing);

  const [seats, setSeats] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const p of parties) init[p.id] = existing?.seats[p.id]?.toString() ?? "";
    return init;
  });
  const [isDouble, setIsDouble] = useState(existing?.is_double ?? false);
  const [hasSniper, setHasSniper] = useState(existing?.has_sniper ?? false);
  const [hasPassfail, setHasPassfail] = useState(existing?.has_passfail ?? false);
  const [pf, setPf] = useState<Record<string, "pass" | "fail" | "">>(() => {
    const init: Record<string, "pass" | "fail" | ""> = {};
    for (const p of swing)
      init[p.id] = existing?.passfail[p.id] === undefined ? "" : existing.passfail[p.id] ? "pass" : "fail";
    return init;
  });
  const [msg, setMsg] = useState<string | null>(null);

  const sum = useMemo(
    () => parties.reduce((s, p) => s + (parseInt(seats[p.id] || "0", 10) || 0), 0),
    [seats, parties],
  );
  const lowSeatParties = useMemo(
    () =>
      parties.filter((p) => {
        const n = parseInt(seats[p.id] || "0", 10);
        return n >= 1 && n <= 3;
      }),
    [seats, parties],
  );
  const amount =
    round.base_bet +
    (isDouble ? round.double_cost : 0) +
    (hasSniper ? round.sniper_cost : 0) +
    (hasPassfail ? round.passfail_cost : 0);

  async function action(formData: FormData) {
    setMsg(null);
    const res = await submitBid(null, formData);
    if (!res.ok) {
      setMsg(res.error ?? "שגיאה");
      return;
    }
    router.push("/me");
    router.refresh();
  }

  return (
    <form action={action} className="space-y-5">
      {/* Nickname */}
      <div className="card p-5">
        <label className="label" htmlFor="nickname">
          כינוי (יוצג בטבלה לכל המשתתפים)
        </label>
        <input
          id="nickname"
          name="nickname"
          defaultValue={existing?.nickname ?? ""}
          maxLength={40}
          required
          placeholder="איך שיקראו לך בטבלה"
          className="input"
        />
      </div>

      {/* Seats */}
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">ניחוש מנדטים</h2>
          <div
            className={`badge ${
              sum === TOTAL_SEATS ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            סה"כ {sum} / {TOTAL_SEATS}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {parties.map((p) => {
            const n = parseInt(seats[p.id] || "0", 10);
            const low = n >= 1 && n <= 3;
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 ${
                  low ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-slate-50/50"
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  {p.nickname}
                  {p.is_swing && (
                    <span className="badge bg-brand-50 text-brand-600" title="מפלגה מתנדנדת">
                      מתנדנדת
                    </span>
                  )}
                </span>
                <input
                  type="number"
                  name={`seat_${p.id}`}
                  min={0}
                  max={120}
                  inputMode="numeric"
                  value={seats[p.id]}
                  onChange={(e) => setSeats((s) => ({ ...s, [p.id]: e.target.value }))}
                  className="input w-20 text-center"
                  placeholder="0"
                />
              </div>
            );
          })}
        </div>

        {lowSeatParties.length > 0 && (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
            ⚠️ סימנת 1–3 מנדטים ל: {lowSeatParties.map((p) => p.nickname).join(", ")}. לפי התקנון
            (3.1.4) הימור כזה יוקפא עד לתיקון. אפשר לסמן 0 (לא עוברת) או 4 ומעלה.
          </p>
        )}
        {sum !== TOTAL_SEATS && (
          <p className="mt-2 text-xs text-slate-400">
            אין חובה להגיע בדיוק ל‑120, אבל כדאי לשים לב למספר.
          </p>
        )}
      </div>

      {/* Add-ons */}
      <div className="card p-5">
        <h2 className="mb-4 text-lg font-bold">תוספות</h2>
        <div className="space-y-3">
          <Toggle
            name="is_double"
            checked={isDouble}
            onChange={setIsDouble}
            title="הכפלת ההימור"
            desc={`עוד ${ilsShort(round.double_cost)} — נחשב כשני משתתפים ומכפיל את הזכייה במשחק הבסיסי.`}
          />
          <Toggle
            name="has_sniper"
            checked={hasSniper}
            onChange={setHasSniper}
            title="בונוס צלפים 🎯"
            desc={`עוד ${ilsShort(round.sniper_cost)} — פרס למי שניחש הכי הרבה מפלגות במדויק.`}
          />
          <Toggle
            name="has_passfail"
            checked={hasPassfail}
            onChange={setHasPassfail}
            title='הימור "עוברת או לא"'
            desc={`עוד ${ilsShort(round.passfail_cost)} — ניחוש אילו מפלגות מתנדנדות יעברו את אחוז החסימה.`}
          />
        </div>

        {hasPassfail && (
          <div className="mt-4 rounded-xl border border-slate-200 p-3">
            <p className="mb-3 text-sm font-medium text-slate-600">
              האם המפלגות המתנדנדות יעברו את אחוז החסימה ({round.threshold_pct}%)?
            </p>
            <div className="space-y-2">
              {swing.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm">{p.nickname}</span>
                  <div className="flex gap-1">
                    {(["pass", "fail"] as const).map((v) => (
                      <label
                        key={v}
                        className={`chip cursor-pointer ${
                          pf[p.id] === v
                            ? v === "pass"
                              ? "border-green-400 bg-green-50 text-green-700"
                              : "border-red-300 bg-red-50 text-red-600"
                            : "border-slate-200 text-slate-500"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`pf_${p.id}`}
                          value={v}
                          checked={pf[p.id] === v}
                          onChange={() => setPf((s) => ({ ...s, [p.id]: v }))}
                          className="hidden"
                        />
                        {v === "pass" ? "עוברת" : "לא עוברת"}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-4 z-20">
        <div className="card flex items-center justify-between gap-4 p-4 shadow-soft">
          <div>
            <div className="text-xs text-slate-400">סכום לתשלום</div>
            <div className="text-2xl font-extrabold">{ilsShort(amount)}</div>
          </div>
          <div className="flex-1">
            {msg && <p className="mb-2 text-sm text-red-600">{msg}</p>}
            <SubmitButton />
          </div>
        </div>
      </div>
    </form>
  );
}

function Toggle({
  name,
  checked,
  onChange,
  title,
  desc,
}: {
  name: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  desc: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
        checked ? "border-brand-300 bg-brand-50/60" : "border-slate-200 hover:bg-slate-50"
      }`}
    >
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-5 w-5 accent-brand-600"
      />
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-slate-500">{desc}</span>
      </span>
    </label>
  );
}
