"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";
import { ilsShort } from "@/lib/format";
import { BLOCS, type BlocKey } from "@/lib/types";
import { settle, type CalcBid, type CalcConfig, type CalcParty } from "@/lib/calc";

export interface DashScenario {
  config: CalcConfig;
  threshold: number; // seats needed to "pass" (electoral threshold in mandates)
}

export interface DashParty {
  id: string;
  nickname: string;
  is_swing: boolean;
  bloc: BlocKey | null;
  poll_seats: number | null;
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

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl px-3 py-2 ${accent ? "bg-brand-50" : "bg-white"}`}>
      <div className="text-[11px] leading-tight text-slate-500">{label}</div>
      <div className={`mt-0.5 truncate text-sm font-extrabold ${accent ? "text-brand-700" : "text-slate-700"}`}>
        {value}
      </div>
    </div>
  );
}

export function Dashboard({
  parties,
  rows,
  showResults,
  showWinnings,
  scenario,
  abovePoll,
}: {
  parties: DashParty[];
  rows: DashRow[];
  showResults: boolean;
  showWinnings: boolean;
  scenario: DashScenario;
  abovePoll?: ReactNode;
}) {
  // Default to the overview ("מה המצב בינתיים"); switch to results/participants on demand.
  const [tab, setTab] = useState<"table" | "poll">("poll");

  if (rows.length === 0) {
    return <div className="card p-8 text-center text-slate-400">עדיין אין משתתפים פעילים בסבב הזה.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-xl bg-slate-100 p-1 text-sm font-semibold">
        <button
          onClick={() => setTab("poll")}
          className={`rounded-lg px-4 py-1.5 transition ${tab === "poll" ? "bg-white shadow-sm" : "text-slate-500"}`}
        >
          📊 מה המצב בינתיים
        </button>
        <button
          onClick={() => setTab("table")}
          className={`rounded-lg px-4 py-1.5 transition ${tab === "table" ? "bg-white shadow-sm" : "text-slate-500"}`}
        >
          {showWinnings ? "🏆 תוצאות" : "👥 משתתפים"}
        </button>
      </div>

      {tab === "table" ? (
        <ParticipantsTable
          parties={parties}
          rows={rows}
          showResults={showResults}
          showWinnings={showWinnings}
          scenario={scenario}
        />
      ) : (
        <>
          {abovePoll}
          <AveragePoll parties={parties} rows={rows} />
        </>
      )}
    </div>
  );
}

export interface BidMetrics {
  potTotal: number;
  pollTotal: number; // winnings if results = poll averages (with current bid)
  perfectTotal: number; // winnings if this bid nailed the poll averages exactly
  mostSimilar: string | null; // party nickname closest to everyone's average
  mostDifferent: string | null; // party nickname furthest from everyone's average
}

function ParticipantsTable({
  parties,
  rows,
  showResults,
  showWinnings,
  scenario,
}: {
  parties: DashParty[];
  rows: DashRow[];
  showResults: boolean;
  showWinnings: boolean;
  scenario: DashScenario;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const cols = 3 + (showResults ? 2 : 0) + 1;

  // "What-if" projections using the news-poll averages as the assumed result.
  const metricsByNick = useMemo(() => {
    const { config, threshold } = scenario;
    const pollParties: CalcParty[] = parties.map((p) => ({
      id: p.id,
      nickname: p.nickname,
      is_swing: p.is_swing,
      actual_seats: p.poll_seats ?? 0,
      actual_passed: p.is_swing ? (p.poll_seats ?? 0) >= threshold : null,
    }));
    const calcBids: CalcBid[] = rows.map((r) => ({
      id: r.nickname,
      nickname: r.nickname,
      seats: r.seats,
      passfail: r.passfail,
      is_double: r.is_double,
      has_sniper: r.has_sniper,
      has_passfail: r.has_passfail,
    }));
    const perfectSeats = Object.fromEntries(pollParties.map((p) => [p.id, p.actual_seats]));
    const perfectPf = Object.fromEntries(
      pollParties.filter((p) => p.is_swing).map((p) => [p.id, p.actual_passed]),
    );
    const avg: Record<string, number> = {};
    for (const p of parties) avg[p.id] = rows.reduce((a, r) => a + (r.seats[p.id] ?? 0), 0) / (rows.length || 1);

    const base = settle(pollParties, calcBids, config);
    const potTotal = base.pots.basicTotal + base.pots.sniperPot + base.pots.passfailPot;
    const pollById = new Map(base.results.map((x) => [String(x.id), x.total]));

    const out = new Map<string, BidMetrics>();
    for (const r of rows) {
      // perfect bid for this user (nailed the poll averages)
      const perfectBids = calcBids.map((b) =>
        b.id === r.nickname ? { ...b, seats: perfectSeats, passfail: perfectPf, has_sniper: true, has_passfail: true } : b,
      );
      const perfectTotal =
        settle(pollParties, perfectBids, config).results.find((x) => String(x.id) === r.nickname)?.total ?? 0;
      // most similar / different party vs everyone's average
      let sim: { p: string; d: number } | null = null;
      let dif: { p: string; d: number } | null = null;
      for (const p of parties) {
        const d = Math.abs((r.seats[p.id] ?? 0) - avg[p.id]);
        if (sim === null || d < sim.d) sim = { p: p.nickname, d };
        if (dif === null || d > dif.d) dif = { p: p.nickname, d };
      }
      out.set(r.nickname, {
        potTotal,
        pollTotal: pollById.get(r.nickname) ?? 0,
        perfectTotal,
        mostSimilar: sim?.p ?? null,
        mostDifferent: dif?.p ?? null,
      });
    }
    return out;
  }, [parties, rows, scenario]);

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
                        <PredictionDetail party={parties} row={r} metrics={metricsByNick.get(r.nickname)} />
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

function PredictionDetail({
  party,
  row,
  metrics,
}: {
  party: DashParty[];
  row: DashRow;
  metrics?: BidMetrics;
}) {
  const blocSums: Record<string, number> = { coalition: 0, change: 0, arab: 0 };
  for (const p of party) if (p.bloc) blocSums[p.bloc] += row.seats[p.id] ?? 0;
  const total = party.reduce((s, p) => s + (row.seats[p.id] ?? 0), 0);

  return (
    <div className="space-y-3">
      {metrics && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Stat label="בקופה כרגע" value={ilsShort(metrics.potTotal)} />
          <Stat label="זכייה אם התוצאות כמו הסקרים" value={ilsShort(metrics.pollTotal)} accent />
          <Stat label="זכייה אם היית מנחש בול" value={ilsShort(metrics.perfectTotal)} accent />
          <Stat label="הכי דומה לכולם" value={metrics.mostSimilar ?? "—"} />
          <Stat label="הכי שונה מכולם" value={metrics.mostDifferent ?? "—"} />
        </div>
      )}
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

const BET_COLOR = "#294a6a"; // ממוצע ההימורים (navy)
const POLL_COLOR = "#c3a878"; // סקרי החדשות (brass)

function AveragePoll({ parties, rows }: { parties: DashParty[]; rows: DashRow[] }) {
  const poll = useMemo(() => {
    const n = rows.length || 1;
    return parties
      .map((p) => ({ p, avg: rows.reduce((s, r) => s + (r.seats[p.id] ?? 0), 0) / n }))
      .sort((a, b) => (b.p.poll_seats ?? b.avg) - (a.p.poll_seats ?? a.avg));
  }, [parties, rows]);

  const hasPolls = poll.some((x) => x.p.poll_seats != null);
  const max = Math.max(1, ...poll.map((x) => Math.max(x.avg, x.p.poll_seats ?? 0)));
  const blocAvg: Record<string, number> = { coalition: 0, change: 0, arab: 0 };
  const blocPoll: Record<string, number> = { coalition: 0, change: 0, arab: 0 };
  for (const { p, avg } of poll)
    if (p.bloc) {
      blocAvg[p.bloc] += avg;
      blocPoll[p.bloc] += p.poll_seats ?? 0;
    }

  const Bar = ({ value, color }: { value: number; color: string }) => (
    <div className="h-4 flex-1 overflow-hidden rounded bg-slate-100">
      <div
        className="flex h-full items-center justify-end rounded px-1.5 text-[11px] font-bold text-white transition-all"
        style={{ width: `${Math.max((value / max) * 100, 9)}%`, background: color }}
      >
        {value.toFixed(value % 1 === 0 ? 0 : 1)}
      </div>
    </div>
  );

  return (
    <div className="card space-y-4 p-5">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-4 rounded" style={{ background: BET_COLOR }} />
          ממוצע ההימורים ({rows.length} משתתפים)
        </span>
        {hasPolls && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-4 rounded" style={{ background: POLL_COLOR }} />
            סקרי החדשות
          </span>
        )}
      </div>

      {/* Bloc totals */}
      <div className="grid gap-2 sm:grid-cols-3">
        {BLOCS.map((b) => (
          <div
            key={b.key}
            className="rounded-xl border-r-4 bg-slate-50/70 px-3 py-2"
            style={{ borderColor: b.color }}
          >
            <div className="text-sm font-bold" style={{ color: b.color }}>
              {b.label}
            </div>
            <div className="mt-1 flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: BET_COLOR }} />
                <b>{blocAvg[b.key].toFixed(0)}</b>
              </span>
              {hasPolls && (
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: POLL_COLOR }} />
                  <b>{blocPoll[b.key]}</b>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Per-party comparison */}
      <div className="space-y-3">
        {poll.map(({ p, avg }) => (
          <div key={p.id}>
            <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <span className="h-2 w-2 rounded-full" style={{ background: blocColor(p.bloc) }} />
              {p.nickname}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-14 shrink-0 text-[11px] text-slate-400">הימורים</span>
                <Bar value={avg} color={BET_COLOR} />
              </div>
              {p.poll_seats != null && (
                <div className="flex items-center gap-2">
                  <span className="w-14 shrink-0 text-[11px] text-slate-400">סקר</span>
                  <Bar value={p.poll_seats} color={POLL_COLOR} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
