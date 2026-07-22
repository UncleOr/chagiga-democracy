import { getAllRounds, getAdminBids } from "@/lib/data";
import { markPaid } from "@/lib/actions/admin";
import { ils, dateHe } from "@/lib/format";

export default async function AdminPayments({
  searchParams,
}: {
  searchParams: Promise<{ round?: string }>;
}) {
  const { round: roundParam } = await searchParams;
  const rounds = await getAllRounds();
  const round = rounds.find((r) => r.id === roundParam) ?? rounds[0];
  if (!round) return <p className="text-sm text-slate-400">אין סבב.</p>;

  const bids = await getAdminBids(round.id);
  // claimed-but-unpaid first, then unpaid, then paid
  const sorted = [...bids].sort((a, b) => {
    const rank = (x: typeof a) => (x.paid ? 2 : x.payment_claimed ? 0 : 1);
    return rank(a) - rank(b);
  });
  const paidCount = bids.filter((b) => b.paid).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">תשלומים · {round.name}</h2>
        <span className="text-sm text-slate-400">
          {paidCount}/{bids.length} שולמו
        </span>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-right text-xs text-slate-400">
              <th className="px-3 py-3">כינוי</th>
              <th className="px-3 py-3">מייל</th>
              <th className="px-3 py-3">סכום</th>
              <th className="px-3 py-3">הוגש</th>
              <th className="px-3 py-3">סטטוס</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((b) => (
              <tr key={b.id} className="border-b border-slate-50">
                <td className="px-3 py-3 font-semibold">
                  {b.nickname}
                  {b.frozen && <span className="badge mr-2 bg-amber-100 text-amber-700">מוקפא</span>}
                </td>
                <td className="px-3 py-3 text-slate-500">{b.email}</td>
                <td className="px-3 py-3 tabular-nums">{ils(b.amount_due)}</td>
                <td className="px-3 py-3 text-slate-400">{dateHe(b.created_at)}</td>
                <td className="px-3 py-3">
                  {b.paid ? (
                    <span className="badge bg-green-100 text-green-700">שולם</span>
                  ) : b.payment_claimed ? (
                    <span className="badge bg-amber-100 text-amber-700">סימן ששילם</span>
                  ) : (
                    <span className="badge bg-slate-100 text-slate-400">ממתין</span>
                  )}
                </td>
                <td className="px-3 py-3 text-left">
                  <form action={markPaid.bind(null, b.id, !b.paid)}>
                    <button className={b.paid ? "btn-ghost" : "btn-primary"}>
                      {b.paid ? "ביטול" : "אישור תשלום"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {bids.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                  אין הימורים בסבב זה.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
