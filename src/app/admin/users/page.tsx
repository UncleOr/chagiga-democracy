import { getAllProfiles } from "@/lib/data";
import { getProfile } from "@/lib/auth";
import {
  setUserAdmin,
  setUserBanned,
  resetUserBid,
  deleteUser,
  resetUserPassword,
} from "@/lib/actions/admin";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { dateHe } from "@/lib/format";

export default async function AdminUsers() {
  const [profiles, me] = await Promise.all([getAllProfiles(), getProfile()]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">משתמשים</h2>
        <span className="text-sm text-slate-400">{profiles.length} רשומים</span>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-right text-xs text-slate-400">
              <th className="px-3 py-3">שם</th>
              <th className="px-3 py-3">מייל</th>
              <th className="px-3 py-3">נרשם</th>
              <th className="px-3 py-3">הרשאות</th>
              <th className="px-3 py-3 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => {
              const isSelf = p.id === me?.id;
              return (
                <tr key={p.id} className={`border-b border-slate-50 ${p.banned ? "bg-red-50/40" : ""}`}>
                  <td className="px-3 py-3 font-semibold">{p.display_name || "—"}</td>
                  <td className="px-3 py-3 text-slate-500">{p.email}</td>
                  <td className="px-3 py-3 text-slate-400">{dateHe(p.created_at)}</td>
                  <td className="px-3 py-3">
                    <span className="flex flex-wrap gap-1">
                      {p.is_admin && <span className="badge bg-brand-50 text-brand-700">מנהל</span>}
                      {p.banned && <span className="badge bg-red-100 text-red-600">חסום</span>}
                      {!p.is_admin && !p.banned && <span className="text-slate-300">משתתף</span>}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-left">
                    {isSelf ? (
                      <span className="text-xs text-slate-300">(אתה)</span>
                    ) : (
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <form action={setUserAdmin.bind(null, p.id, !p.is_admin)}>
                          <button className="btn-ghost !px-2.5 !py-1 text-xs">
                            {p.is_admin ? "הסרת ניהול" : "הפיכה למנהל"}
                          </button>
                        </form>
                        <form action={resetUserPassword.bind(null, p.id)}>
                          <button className="btn-ghost !px-2.5 !py-1 text-xs">איפוס סיסמה</button>
                        </form>
                        <form action={setUserBanned.bind(null, p.id, !p.banned)}>
                          <button
                            className={`btn-ghost !px-2.5 !py-1 text-xs ${
                              p.banned ? "" : "border-amber-200 text-amber-600 hover:bg-amber-50"
                            }`}
                          >
                            {p.banned ? "ביטול השעיה" : "השעיה"}
                          </button>
                        </form>
                        <form action={resetUserBid.bind(null, p.id)}>
                          <ConfirmSubmit
                            confirmText={`לאפס (למחוק) את ההימור של ${p.display_name || p.email}? הפעולה אינה הפיכה.`}
                            className="btn-ghost !px-2.5 !py-1 text-xs"
                          >
                            איפוס הימור
                          </ConfirmSubmit>
                        </form>
                        <form action={deleteUser.bind(null, p.id)}>
                          <ConfirmSubmit
                            confirmText={`למחוק לצמיתות את ${p.display_name || p.email} כולל ההימור? הפעולה אינה הפיכה.`}
                            className="btn-ghost !px-2.5 !py-1 text-xs border-red-200 text-red-500 hover:bg-red-50"
                          >
                            מחיקה
                          </ConfirmSubmit>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400">
        מנהלים מוגדרים אוטומטית לפי רשימת המיילים ב־<code>admin_emails</code> בעת ההתחברות הראשונה, וניתן לעדכן כאן.
      </p>
    </div>
  );
}
