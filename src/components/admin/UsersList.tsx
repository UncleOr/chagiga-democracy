"use client";

import { useMemo, useState } from "react";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { ils, dateHe } from "@/lib/format";

export interface UserRow {
  id: string;
  display_name: string | null;
  email: string;
  is_admin: boolean;
  banned: boolean;
  created_at: string;
  isSelf: boolean;
  bid: { id: string; amount_due: number; paid: boolean; payment_claimed: boolean } | null;
}

type Filter = "all" | "bet" | "unpaid" | "nobet";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "הכל" },
  { key: "bet", label: "הימרו" },
  { key: "unpaid", label: "לא שילמו" },
  { key: "nobet", label: "לא הימרו" },
];

export function UsersList({
  rows,
  actions,
}: {
  rows: UserRow[];
  actions: {
    markPaid: (bidId: string, paid: boolean) => Promise<void>;
    setUserAdmin: (userId: string, value: boolean) => Promise<void>;
    setUserBanned: (userId: string, value: boolean) => Promise<void>;
    resetUserBid: (userId: string) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    resetUserPassword: (userId: string) => Promise<void>;
  };
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: 0, bet: 0, unpaid: 0, nobet: 0 };
    for (const r of rows) {
      c.all++;
      if (r.bid) {
        c.bet++;
        if (!r.bid.paid) c.unpaid++;
      } else c.nobet++;
    }
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "bet" && !r.bid) return false;
      if (filter === "unpaid" && !(r.bid && !r.bid.paid)) return false;
      if (filter === "nobet" && r.bid) return false;
      if (q) {
        const hay = `${r.display_name ?? ""} ${r.email}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, query, filter]);

  return (
    <div className="space-y-3">
      {/* Search + filters */}
      <div className="card space-y-3 p-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 חיפוש לפי שם או אימייל…"
          className="input"
        />
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const active = f.key === filter;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  active ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f.label} ({counts[f.key]})
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-xs text-slate-400">מציג {filtered.length} מתוך {rows.length}</div>

      <div className="grid gap-3">
        {filtered.map((r) => (
          <div key={r.id} className={`card p-4 ${r.banned ? "border-red-200 bg-red-50/40" : ""}`}>
            {/* Identity */}
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">{r.display_name || "—"}</span>
                  {r.is_admin && <span className="badge bg-brand-50 text-brand-700">מנהל</span>}
                  {r.banned && <span className="badge bg-red-100 text-red-600">מושעה</span>}
                  {r.isSelf && <span className="badge bg-slate-100 text-slate-400">אתה</span>}
                </div>
                <div className="mt-0.5 truncate text-sm text-slate-500">{r.email}</div>
                <div className="text-xs text-slate-400">נרשם {dateHe(r.created_at)}</div>
              </div>

              {/* Payment status */}
              <div className="text-left">
                {r.bid ? (
                  <>
                    <div className="text-sm font-bold tabular-nums">{ils(r.bid.amount_due)}</div>
                    <div className="mt-1">
                      {r.bid.paid ? (
                        <span className="badge bg-green-100 text-green-700">שולם</span>
                      ) : r.bid.payment_claimed ? (
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
              {r.bid && (
                <form action={actions.markPaid.bind(null, r.bid.id, !r.bid.paid)}>
                  <button
                    className={`btn-ghost !px-3 !py-1.5 text-xs ${
                      r.bid.paid
                        ? "border-green-200 text-green-600"
                        : "border-brand-300 !bg-brand-50 text-brand-700"
                    }`}
                  >
                    {r.bid.paid ? "✓ שולם — בטל" : "💰 סמן כשולם"}
                  </button>
                </form>
              )}
              <form action={actions.setUserAdmin.bind(null, r.id, !r.is_admin)}>
                <button className="btn-ghost !px-3 !py-1.5 text-xs">
                  {r.is_admin ? "הסרת ניהול" : "הפיכה למנהל"}
                </button>
              </form>
              <form action={actions.resetUserPassword.bind(null, r.id)}>
                <button className="btn-ghost !px-3 !py-1.5 text-xs">איפוס סיסמה</button>
              </form>
              {!r.isSelf && (
                <>
                  <form action={actions.setUserBanned.bind(null, r.id, !r.banned)}>
                    <button
                      className={`btn-ghost !px-3 !py-1.5 text-xs ${
                        r.banned ? "" : "border-amber-200 text-amber-600 hover:bg-amber-50"
                      }`}
                    >
                      {r.banned ? "ביטול השעיה" : "השעיה"}
                    </button>
                  </form>
                  {r.bid && (
                    <form action={actions.resetUserBid.bind(null, r.id)}>
                      <ConfirmSubmit
                        confirmText={`לאפס (למחוק) את ההימור של ${r.display_name || r.email}? הפעולה אינה הפיכה.`}
                        className="btn-ghost !px-3 !py-1.5 text-xs"
                      >
                        איפוס הימור
                      </ConfirmSubmit>
                    </form>
                  )}
                  <form action={actions.deleteUser.bind(null, r.id)}>
                    <ConfirmSubmit
                      confirmText={`למחוק לצמיתות את ${r.display_name || r.email} כולל ההימור? הפעולה אינה הפיכה.`}
                      className="btn-ghost !px-3 !py-1.5 text-xs border-red-200 text-red-500 hover:bg-red-50"
                    >
                      מחיקה
                    </ConfirmSubmit>
                  </form>
                </>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="card p-6 text-center text-sm text-slate-400">אין תוצאות לסינון הזה.</p>
        )}
      </div>
    </div>
  );
}
