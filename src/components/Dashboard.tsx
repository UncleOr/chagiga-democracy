"use client";

import { Fragment, useMemo, useState } from "react";
import { ilsShort } from "@/lib/format";
import { BLOCS, type BlocKey } from "@/lib/types";

export interface DashParty {
  id: string;
  nickname: string;
  is_swing: boolean;
  bloc: BlocKey | null;
  actual_seats: number | null;
}

export interface DashRow {
  nickname: string;
  is_double: boolean;
  has_sniper: boolean;
  has_passfail: boolean;
  paid: boolean;
  frozen: boolean;
  seats: Record<string, number>;
  passfail: Record<string, boolean>;
  totalDelta?: number;
  snipes?: number;
  correctPassfail?: number;
  total?: number;
}

const blocColor = (b: BlocKey | null) => BLOCS.find((x) => x.key === b)?.color ?? "#94a3b8";
const medal = (i: number) => ["🥇", "🥈", "🥉"][i] ?? (i + 1).toString();

export function Dashboard({
  parties,
  rows,
  showResults,
  showWinnings,
}: {
  parties: DashParty[];
  rows: DashRow[];
  showResults: boolean;
  showWinnings: boolean;
}) {
  const [tab, setTab] = useState<"table" | "poll">("table");

  if (rows.length === 0) {
    return <div className="card p-8 text-center text-slate-400">עדיין אין משתתפים פעילים בסבב הזה.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-xl bg-slate-100 p-1 text-sm font-semibold">
        <button
          onClick={() => setTab("table")}
          className={`rounded-lg px-4 py-1.5 transition ${tab === "table" ? "bg-white shadow-sm" : "text-slate-500"}`}
        >
          {showWinnings ? "🏆 תוצאות" : "👥 משתתפים"}
        </button>
        <button
          onClick={() => setTab("poll")}
          className={`rounded-lg px-4 py-1.5 transition ${tab === "poll" ? "bg-white shadow-sm" : "text-slate-500"}`}
        >
          📊 סקר ממוצע
        </button>
      </div>

      {tab === "table" ? (
        <ParticipantsTable parties={parties} rows={rows} showResults={showResults} showWinnings={showWinnings} />
      ) : (
        <AveragePoll parties={parties} rows={rows} />
      )}
    </div>
  );
}

function ParticipantsTable({
  parties,
  rows,
  showResults,
  showWinnings,
}: {
  parties: DashParty[];
  rows: DashRow[];
  showResults: boolean;
  showWinnings: boolean;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const cols = 3 + (showResults ? 2 : 0) + 1;

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
              {showWinnings ? (
                <th className="px-3 py-3 text-left font-medium">זכייה</th>
              ) : (
                <th className="px-3 py-3 font-medium">תשלום</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const isOpen = open === r.nickname;
              return (
                <Fragment key={r.nickname}>
                  <tr
                    onClick={() => setOpen(isOpen ? null : r.nickname)}
                    className={`cursor-pointer border-b border-slate-50 transition hover:bg-slate-50 ${
                      i < 3 && showResults ? "bg-gold-400/5" : ""
                    }`}
                  >
                    <td className="px-3 py-3 font-bold text-slate-400">{showResults ? medal(i) : i + 1}</td>
                    <td className="px-3 py-3 font-semibold">
                      <span className="flex items-center gap-2">
                        <span className={`text-slate-300 transition ${isOpen ? "rotate-90" : ""}`}>›</span>
                        {r.nickname}
                        {r.frozen && <span className="badge bg-amber-100 text-amber-700">מוקפא</span>}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="flex flex-wrap gap-1">
                        {r.is_double && <span className="badge bg-brand-50 text-brand-600">×2</span>}
                        {r.has_sniper && <span className="badge bg-gold-400/15 text-gold-600">🎯</span>}
                        {r.has_passfail && <span className="badge bg-slate-100 text-slate-500">עו/לא</span>}
                        {!r.is_double && !r.has_sniper && !r.has_passfail && <span className="text-slate-300">—</span>}
                      </span>
                    </td>
                    {showResults && <td className="px-3 py-3 tabular-nums">{r.totalDelta ?? "—"}</td>}
                    {showResults && (
                      <td className="px-3 py-3 tabular-nums">{r.has_sniper ? r.snipes ?? 0 : "—"}</td>
                    )}
                    {showWinnings ? (
                      <td className="px-3 py-3 text-left font-extrabold text-brand-700 tabular-nums">
                        {ilsShort(r.total ?? 0)}
                      </td>
                    ) : (
                      <td className="px-3 py-3">
                        {r.paid ? (
                          <span className="badge bg-green-100 text-green-700">שולם</span>
                        ) : (
                          <span className="badge bg-slate-100 text-slate-400">ממתין</span>
                        )}
                      </td>
                    )}
                  </tr>
                  {isOpen && (
                    <tr className="border-b border-slate-100 bg-slate-50/60">
                      <td colSpan={cols} className="px-4 py-4">
                        <PredictionDetail party={parties} row={r} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-slate-100 px-3 py-2 text-center text-xs text-slate-400">
        לחצו על שורה כדי לראות את ניחוש המנדטים המלא
      </p>
    </div>
  );
}

function PredictionDetail({ party, row }: { party: DashParty[]; row: DashRow }) {
  const blocSums: Record<string, number> = { coalition: 0, change: 0, arab: 0 };
  for (const p of party) if (p.bloc) blocSums[p.bloc] += row.seats[p.id] ?? 0;
  const total = party.reduce((s, p) => s + (row.seats[p.id] ?? 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {BLOCS.map((b) => (
          <span
            key={b.key}
            className="rounded-lg px-2.5 py-1 text-xs font-semibold"
            style={{ background: `${b.color}14`, color: b.color }}
          >
            {b.label}: {blocSums[b.key]}
          </span>
        ))}
        <span className="rounded-lg bg-slate-200/60 px-2.5 py-1 text-xs font-semibold text-slate-500">
          סה"כ {total}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
        {party.map((p) => {
          const n = row.seats[p.id] ?? 0;
          const pf = row.has_passfail && p.is_swing ? row.passfail[p.id] : undefined;
          return (
            <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-1.5">
              <span className="flex min-w-0 items-center gap-1.5 truncate text-xs text-slate-600">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: blocColor(p.bloc) }} />
                <span className="truncate">{p.nickname}</span>
                {pf !== undefined && (
                  <span className={`text-[10px] ${pf ? "text-green-600" : "text-red-500"}`}>
                    {pf ? "✓עוברת" : "✗לא"}
                  </span>
                )}
              </span>
              <span className="font-bold tabular-nums">{n}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AveragePoll({ parties, rows }: { parties: DashParty[]; rows: DashRow[] }) {
  const poll = useMemo(() => {
    const n = rows.length || 1;
    return parties
      .map((p) => {
        const avg = rows.reduce((s, r) => s + (r.seats[p.id] ?? 0), 0) / n;
        return { p, avg };
      })
      .sort((a, b) => b.avg - a.avg);
  }, [parties, rows]);

  const max = Math.max(1, ...poll.map((x) => x.avg));
  const blocAvg: Record<string, number> = { coalition: 0, change: 0, arab: 0 };
  for (const { p, avg } of poll) if (p.bloc) blocAvg[p.bloc] += avg;

  return (
    <div className="card space-y-4 p-5">
      <div className="flex flex-wrap gap-2">
        {BLOCS.map((b) => (
          <span
            key={b.key}
            className="rounded-lg px-3 py-1.5 text-sm font-bold"
            style={{ background: `${b.color}14`, color: b.color }}
          >
            {b.label}: {blocAvg[b.key].toFixed(1)}
          </span>
        ))}
      </div>
      <div className="space-y-2">
        {poll.map(({ p, avg }) => (
          <div key={p.id} className="flex items-center gap-3">
            <div className="w-28 shrink-0 truncate text-sm text-slate-600" title={p.nickname}>
              {p.nickname}
            </div>
            <div className="h-6 flex-1 overflow-hidden rounded-lg bg-slate-100">
              <div
                className="flex h-full items-center justify-end rounded-lg px-2 text-xs font-bold text-white transition-all"
                style={{ width: `${Math.max((avg / max) * 100, 6)}%`, background: blocColor(p.bloc) }}
              >
                {avg.toFixed(1)}
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-slate-400">
        ממוצע המנדטים לכל מפלגה לפי {rows.length} ההימורים · צבע לפי גוש
      </p>
    </div>
  );
}
