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
import { UsersList, type UserRow } from "@/components/admin/UsersList";

export default async function AdminUsers() {
  const [profiles, me, round] = await Promise.all([getAllProfiles(), getProfile(), getActiveRound()]);
  const bids = round ? await getAdminBids(round.id) : [];
  const bidByEmail = new Map(bids.map((b) => [b.email, b]));
  const paidCount = bids.filter((b) => b.paid).length;

  const rows: UserRow[] = profiles.map((p) => {
    const b = bidByEmail.get(p.email);
    return {
      id: p.id,
      display_name: p.display_name,
      email: p.email,
      is_admin: p.is_admin,
      banned: p.banned,
      created_at: p.created_at,
      isSelf: p.id === me?.id,
      bid: b
        ? { id: b.id, amount_due: b.amount_due, paid: b.paid, payment_claimed: b.payment_claimed }
        : null,
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold">משתמשים ותשלומים</h2>
        <span className="text-sm text-slate-400">
          {profiles.length} רשומים · {paidCount}/{bids.length} שילמו
        </span>
      </div>

      <UsersList
        rows={rows}
        actions={{ markPaid, setUserAdmin, setUserBanned, resetUserBid, deleteUser, resetUserPassword }}
      />

      <p className="text-xs text-slate-400">
        סימון “שולם” הופך את המשתתף לפעיל ומכניס אותו לחישובים. מנהלים מוגדרים אוטומטית לפי{" "}
        <code>admin_emails</code> בהתחברות הראשונה.
      </p>
    </div>
  );
}
