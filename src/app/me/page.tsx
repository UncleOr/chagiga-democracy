import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getActiveRound, getParties, getMyBid, getRoundData, settleRoundData } from "@/lib/data";
import { ilsShort } from "@/lib/format";
import { ClaimPaidButton } from "@/components/ClaimPaidButton";
import { NicknameCard } from "@/components/NicknameCard";

export default async function MePage() {
  const profile = await requireUser();
  const round = await getActiveRound();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-extrabold">האזור האישי</h1>
      <NicknameCard current={profile.display_name} />
      {!round ? (
        <div className="card p-8 text-center text-slate-500">אין סבב פעיל כרגע.</div>
      ) : (
        <BetSection roundId={round.id} userId={profile.id} />
      )}
    </div>
  );
}

async function BetSection({ roundId, userId }: { roundId: string; userId: string }) {
  const round = (await getActiveRound())!;
  const [parties, myBid] = await Promise.all([getParties(roundId), getMyBid(roundId, userId)]);

  if (!myBid) {
    return (
      <div className="card p-8 text-center">
        <div className="mb-2 text-4xl">🎲</div>
        <h2 className="text-xl font-bold">עוד לא הימרת</h2>
        <p className="mt-2 text-sm text-slate-500">{round.name}</p>
        {round.status === "open" ? (
          <Link href="/bet" className="btn-primary mt-5">
            להימור
          </Link>
        ) : (
          <p className="mt-4 text-sm text-slate-400">ההימורים סגורים.</p>
        )}
      </div>
    );
  }

  // My winnings, if settled
  let myWin: number | null = null;
  if (round.status === "settled") {
    const data = await getRoundData(round.id);
    const settlement = data && settleRoundData(data, { onlyPaid: true });
    const mine = settlement?.results.find((r) => r.id === myBid.id);
    myWin = mine?.total ?? 0;
  }

  const seatParties = parties.filter((p) => myBid.seats[p.id] != null);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold">ההימור שלי</h2>
          <p className="text-sm text-slate-500">{round.name}</p>
        </div>
        {round.status === "open" && (
          <Link href="/bet" className="btn-ghost">
            עריכה
          </Link>
        )}
      </div>

      {myBid.frozen && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          ⚠️ ההימור מוקפא: יש מפלגות שסימנת להן 1–3 מנדטים (תקנון 3.1.4). ערכו את ההימור כדי לשחרר אותו.
        </div>
      )}

      {/* Payment */}
      <PaymentCard
        status={round.status}
        amount={myBid.amount_due}
        paid={myBid.paid}
        claimed={myBid.payment_claimed}
        payboxUrl={round.paybox_url}
      />

      {/* Winnings */}
      {round.status === "settled" && (
        <div className="card p-5 text-center">
          <div className="text-sm text-slate-400">הזכייה שלך</div>
          <div className="text-3xl font-extrabold text-brand-700">{ilsShort(myWin ?? 0)}</div>
          {!myBid.paid && (
            <p className="mt-2 text-xs text-amber-600">
              הימור זה לא סומן כמשולם ולכן אינו נכלל בחלוקת הקופה.
            </p>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="card p-5">
        <h2 className="mb-3 font-bold">סיכום ההימור</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="chip border-slate-200">בסיסי · {ilsShort(round.base_bet)}</span>
          {myBid.is_double && <span className="chip border-brand-200 bg-brand-50 text-brand-700">הכפלה ×2</span>}
          {myBid.has_sniper && <span className="chip border-gold-400 bg-gold-400/10">🎯 בונוס צלפים</span>}
          {myBid.has_passfail && <span className="chip border-slate-200">עוברת או לא</span>}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {seatParties.map((p) => (
            <div key={p.id} className="flex justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-sm">
              <span className="text-slate-600">{p.nickname}</span>
              <span className="font-semibold">{myBid.seats[p.id]}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function PaymentCard({
  status,
  amount,
  paid,
  claimed,
  payboxUrl,
}: {
  status: string;
  amount: number;
  paid: boolean;
  claimed: boolean;
  payboxUrl: string | null;
}) {
  if (paid) {
    return (
      <div className="card border-green-200 bg-green-50/60 p-5">
        <div className="flex items-center gap-2 font-bold text-green-700">✓ התשלום אושר — אתם משתתפים פעילים</div>
        <p className="mt-1 text-sm text-green-700/80">שילמת {ilsShort(amount)}. ההימור נכלל בקופה.</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm text-slate-400">סכום לתשלום</div>
          <div className="text-2xl font-extrabold">{ilsShort(amount)}</div>
        </div>
        <div className="flex flex-col items-stretch gap-2">
          {payboxUrl ? (
            <a href={payboxUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
              לתשלום ב‑PayBox ←
            </a>
          ) : (
            <span className="text-sm text-slate-400">קישור התשלום יתעדכן בקרוב</span>
          )}
          <ClaimPaidButton />
        </div>
      </div>
      <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
        {claimed
          ? "רשמנו שסימנת ששילמת — הבקשה ממתינה לאישור ידני של המארגנים. ייתכן שלא תראו את עצמכם מיד בטבלה."
          : 'שלמו בקבוצת ה‑PayBox ואז לחצו "כבר שילמתי". האישור מתבצע ידנית על ידי המארגנים.'}
      </p>
    </div>
  );
}
