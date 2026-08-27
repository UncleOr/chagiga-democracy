import Link from "next/link";
import { getProfile } from "@/lib/auth";
import {
  getActiveRound,
  getRoundData,
  currentPots,
  hasResults,
  settleRoundData,
  getMyBid,
} from "@/lib/data";
import { PotsBar } from "@/components/PotsBar";
import { StatusBanner } from "@/components/StatusBanner";
import { Dashboard, type DashRow, type DashParty } from "@/components/Dashboard";
import { HowItWorks } from "@/components/HowItWorks";
import { ShareButtons } from "@/components/ShareButtons";
import { OnboardingModal } from "@/components/OnboardingModal";
import { ProgressSteps } from "@/components/ProgressSteps";
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

  // Onboarding progress for a logged-in player (guides toward bet → pay)
  const myBid = profile ? await getMyBid(round.id, profile.id) : null;
  const progressStep: 1 | 2 | 3 | null =
    profile && !settled ? (!myBid ? 1 : !myBid.paid ? 2 : 3) : null;

  const dashParties: DashParty[] = data.parties.map((p) => ({
    id: p.id,
    nickname: p.nickname,
    is_swing: p.is_swing,
    bloc: p.bloc,
    poll_seats: p.poll_seats,
    actual_seats: p.actual_seats,
  }));

  // Build dashboard rows (each carries the participant's full predictions)
  const bidByNick = new Map(data.bids.map((b) => [b.nickname, b]));
  let rows: DashRow[];
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
        seats: b?.seats ?? {},
        passfail: b?.passfail ?? {},
        totalDelta: r.totalDelta,
        snipes: r.snipes,
        correctPassfail: r.correctPassfail,
        total: r.total,
      };
    });
  } else {
    // Only paid bids count toward the public standings / averages.
    rows = data.bids
      .filter((b) => b.paid)
      .map((b) => ({
        nickname: b.nickname,
        is_double: b.is_double,
        has_sniper: b.has_sniper,
        has_passfail: b.has_passfail,
        paid: b.paid,
        frozen: b.frozen,
        seats: b.seats,
        passfail: b.passfail,
      }));
  }

  return (
    <div className="space-y-6">
      <OnboardingModal />

      {/* Compact title */}
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{round.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          חגיגה של דמוקרטיה · מנחשים את הבחירות, מהמרים עם חברים, והזוכים לוקחים את הקופה 🗳️
        </p>
      </div>

      {/* 1) Status banner with the bet CTA */}
      <StatusBanner round={round} isLoggedIn={!!profile} />

      {/* 2) The dashboard */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold">{settled ? "תוצאות סופיות" : "המצב בסבב"}</h2>
          {pots.participants > 0 && (
            <span className="text-sm text-slate-400">{pots.participants} משתתפים פעילים</span>
          )}
        </div>
        {resultsExist && (
          <div className="mb-3">
            <ResultsStrip parties={data.parties} />
          </div>
        )}
        <Dashboard parties={dashParties} rows={rows} showResults={resultsExist} showWinnings={settled} />
        {settled && settlement && settlement.remainder > 0.01 && (
          <p className="mt-3 rounded-xl bg-slate-50 px-4 py-2 text-xs text-slate-400">
            יתרה שלא חולקה: {settlement.remainder.toFixed(2)} ₪ — מועברת לפי שיקול דעת המארגנים (תקנון 1.7).
          </p>
        )}
      </div>

      {/* 3) Everything else — process, how it works, pot highlights */}
      {progressStep !== null && <ProgressSteps step={progressStep} />}

      <HowItWorks />

      <PotsBar
        participants={pots.participants}
        mandatePot={pots.mandatePot}
        goldPot={pots.goldPot}
        sniperPot={pots.sniperPot}
        passfailPot={pots.passfailPot}
      />

      {/* Invite friends */}
      <div className="card flex flex-wrap items-center justify-between gap-3 bg-gradient-to-l from-brand-50 to-transparent p-5">
        <div>
          <div className="font-extrabold">כיף בחברה 🎉</div>
          <div className="text-sm text-slate-500">ככל שיותר חברים משחקים — הקופה גדולה יותר. שתפו!</div>
        </div>
        <ShareButtons />
      </div>

      {/* Privacy */}
      <div className="text-center">
        <Link href="/privacy" className="text-xs text-slate-400 hover:text-brand-600 hover:underline">
          מדיניות פרטיות
        </Link>
      </div>
    </div>
  );
}
