import { getAllProfiles, getActiveRound, getAdminBids } from "@/lib/data";
import { getProfile } from "@/lib/auth";
import {
  setUserAdmin,
  setUserBanned,
  resetUserBid,
  deleteUser,
  resetUserPassword,
  markPaid,
} from "@/lib/actions/admin";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { ils, dateHe } from "@/lib/format";

export default async function AdminUsers() {
  const [profiles, me, round] = await Promise.all([getAllProfiles(), getProfile(), getActiveRound()]);
  const bids = round ? await getAdminBids(round.id) : [];
  const bidByEmail = new Map(bids.map((b) => [b.email, b]));
  const paidCount = bids.filter((b) => b.paid).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold">משתמשים ותשלומים</h2>
        <span className="text-sm text-slate-400">
          {profiles.length} רשומים · {paidCount}/{bids.length} שילמו
        </span>
      </div>

      <div className="grid gap-3">
        {profiles.map((p) => {
          const isSelf = p.id === me?.id;
          const b = bidByEmail.get(p.email);
          return (
            <div
              key={p.id}
              className={`card p-4 ${p.banned ? "border-red-200 bg-red-50/40" : ""}`}
            >
              {/* Identity */}
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">{p.display_name || "—"}</span>
                    {p.is_admin && <span className="badge bg-brand-50 text-brand-700">מנהל</span>}
                    {p.banned && <span className="badge bg-red-100 text-red-600">מושעה</span>}
                    {isSelf && <span className="badge bg-slate-100 text-slate-400">אתה</span>}
                  </div>
                  <div className="mt-0.5 truncate text-sm text-slate-500">{p.email}</div>
                  <div className="text-xs text-slate-400">נרשם {dateHe(p.created_at)}</div>
                </div>

                {/* Payment status + toggle */}
                <div className="text-left">
                  {b ? (
                    <>
                      <div className="text-sm font-bold tabular-nums">{ils(b.amount_due)}</div>
                      <div className="mt-1">
                        {b.paid ? (
                          <span className="badge bg-green-100 text-green-700">שולם</span>
                        ) : b.payment_claimed ? (
                          <span className="badge bg-amber-100 text-amber-700">סימן ששילם</span>
                        ) : (
                          <span className="badge bg-slate-100 text-slate-400">ממתין</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-slate-300">לא הימר</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                {b && (
                  <form action={markPaid.bind(null, b.id, !b.paid)}>
                    <button
                      className={`btn-ghost !px-3 !py-1.5 text-xs ${
                        b.paid ? "border-green-200 text-green-600" : "border-brand-300 !bg-brand-50 text-brand-700"
                      }`}
                    >
                      {b.paid ? "✓ שולם — בטל" : "💰 סמן כשולם"}
                    </button>
                  </form>
                )}
                <form action={setUserAdmin.bind(null, p.id, !p.is_admin)}>
                  <button className="btn-ghost !px-3 !py-1.5 text-xs">
                    {p.is_admin ? "הסרת ניהול" : "הפיכה למנהל"}
                  </button>
                </form>
                <form action={resetUserPassword.bind(null, p.id)}>
                  <button className="btn-ghost !px-3 !py-1.5 text-xs">איפוס סיסמה</button>
                </form>
                {!isSelf && (
                  <>
                    <form action={setUserBanned.bind(null, p.id, !p.banned)}>
                      <button
                        className={`btn-ghost !px-3 !py-1.5 text-xs ${
                          p.banned ? "" : "border-amber-200 text-amber-600 hover:bg-amber-50"
                        }`}
                      >
                        {p.banned ? "ביטול השעיה" : "השעיה"}
                      </button>
                    </form>
                    {b && (
                      <form action={resetUserBid.bind(null, p.id)}>
                        <ConfirmSubmit
                          confirmText={`לאפס (למחוק) את ההימור של ${p.display_name || p.email}? הפעולה אינה הפיכה.`}
                          className="btn-ghost !px-3 !py-1.5 text-xs"
                        >
                          איפוס הימור
                        </ConfirmSubmit>
                      </form>
                    )}
                    <form action={deleteUser.bind(null, p.id)}>
                      <ConfirmSubmit
                        confirmText={`למחוק לצמיתות את ${p.display_name || p.email} כולל ההימור? הפעולה אינה הפיכה.`}
                        className="btn-ghost !px-3 !py-1.5 text-xs border-red-200 text-red-500 hover:bg-red-50"
                      >
                        מחיקה
                      </ConfirmSubmit>
                    </form>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400">
        סימון “שולם” הופך את המשתתף לפעיל ומכניס אותו לחישובים. מנהלים מוגדרים אוטומטית לפי{" "}
        <code>admin_emails</code> בהתחברות הראשונה.
      </p>
    </div>
  );
}
