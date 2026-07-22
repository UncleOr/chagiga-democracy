"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const TABS = [
  { href: "/admin", label: "סבב והגדרות" },
  { href: "/admin/parties", label: "מפלגות" },
  { href: "/admin/results", label: "תוצאות" },
  { href: "/admin/payments", label: "תשלומים" },
  { href: "/admin/users", label: "משתמשים" },
];

export function AdminNav() {
  const pathname = usePathname();
  const params = useSearchParams();
  const round = params.get("round");
  const qs = round ? `?round=${round}` : "";

  return (
    <nav className="flex flex-wrap gap-1 rounded-2xl bg-white p-1 shadow-card">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={`${t.href}${qs}`}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              active ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
