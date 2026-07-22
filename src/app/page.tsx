import Link from "next/link";
import { getProfile } from "@/lib/auth";
import {
  getActiveRound,
  getRoundData,
  currentPots,
  hasResults,
  settleRoundData,
} from "@/lib/data";
import { PotsBar } from "@/components/PotsBar";
import { StatusBanner } from "@/components/StatusBanner";
import { StandingsTable, type StandingRow } from "@/components/StandingsTable";
import { ResultsStrip } from "@/components/ResultsStrip";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [profile, round] = await Promise.all([getProfile(), getActiveRound()]);

  if (!round) {
    return (
      <div className="mx-auto mt-16 max-w-lg text-center">
        <div className="mb-3 text-5xl">🗳️</div>
        <h1 className="text-3xl font-extrabold">חגיגה של דמוקרטיה</h1>
        <p className="mt-3 text-slate-500">
          משחק ניחושי הבחירות בין חברים. עדיין לא נפתח סבב — התחברו כדי לקבל עדכון כשנצא לדרך.
        </p>
        {!profile && (
          <Link href="/login" className="btn-primary mt-6">
            התחברות
          </Link>
        )}
      </div>
    );
  }

  const data = (await getRoundData(round.id))!;
  const pots = currentPots(data);
  const resultsExist = hasResults(data.parties);
  const settled = round.status === "settled";
  const settlement = resultsExist ? settleRoundData(data, { onlyPaid: true }) : null;

  // Build standings rows
  const bidByNick = new Map(data.bids.map((b) => [b.nickname, b]));
  let rows: StandingRow[];
  if (settlement) {
    rows = settlement.results.map((r) => {
      const b = bidByNick.get(r.nickname);
      return {
        nickname: r.nickname,
        is_double: b?.is_double ?? false,
        has_sniper: b?.has_sniper ?? false,
        has_passfail: b?.has_passfail ?? false,
        paid: b?.paid ?? false,
        frozen: b?.frozen ?? false,
        totalDelta: r.totalDelta,
        snipes: r.snipes,
        correctPassfail: r.correctPassfail,
        total: r.total,
      };
    });
  } else {
    // No results yet — list paid participants (active), unpaid shown after.
    const active = data.bids.filter((b) => b.paid);
    const pending = data.bids.filter((b) => !b.paid);
    rows = [...active, ...pending].map((b) => ({
      nickname: b.nickname,
      is_double: b.is_double,
      has_sniper: b.has_sniper,
      has_passfail: b.has_passfail,
      paid: b.paid,
      frozen: b.frozen,
    }));
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">{round.name}</h1>
          <p className="text-sm text-slate-500">חגיגה של דמוקרטיה · משחק ניחושי הבחירות</p>
        </div>
        {round.status === "open" &&
          (profile ? (
            <Link href="/bet" className="btn-primary">
              להימור →
            </Link>
          ) : (
            <Link href="/login?next=/bet" className="btn-primary">
              התחברו והמרו →
            </Link>
          ))}
      </div>

      <StatusBanner round={round} />

      {/* Election results strip (when entered) */}
      {resultsExist && <ResultsStrip parties={data.parties} />}

      <PotsBar
        participants={pots.participants}
        mandatePot={pots.mandatePot}
        goldPot={pots.goldPot}
        sniperPot={pots.sniperPot}
        passfailPot={pots.passfailPot}
      />

      {settled && settlement && settlement.remainder > 0.01 && (
        <p className="rounded-xl bg-slate-50 px-4 py-2 text-xs text-slate-400">
          יתרה שלא חולקה: {settlement.remainder.toFixed(2)} ₪ — מועברת לפי שיקול דעת המארגנים (תקנון 1.7).
        </p>
      )}

      {/* Standings */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold">{settled ? "תוצאות סופיות" : "טבלת המשתתפים"}</h2>
          {pots.participants > 0 && (
            <span className="text-sm text-slate-400">{pots.participants} משתתפים פעילים</span>
          )}
        </div>
        <StandingsTable rows={rows} showResults={resultsExist} showWinnings={settled} />
        <p className="mt-3 text-xs text-slate-400">
          ההימורים והכינויים גלויים לכל המשתתפים (תקנון 2.6). כתובות מייל אינן נחשפות.
        </p>
      </div>
    </div>
  );
}
