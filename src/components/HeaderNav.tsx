"use client";

import { useState } from "react";
import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";

export function HeaderNav({
  isLoggedIn,
  isAdmin,
  name,
}: {
  isLoggedIn: boolean;
  isAdmin: boolean;
  name: string | null;
}) {
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: "טבלה" },
    { href: "/takanon", label: "איך זה עובד" },
    ...(isLoggedIn ? [{ href: "/me", label: "ההימור שלי" }] : []),
    ...(isAdmin ? [{ href: "/admin", label: "ניהול" }] : []),
  ];

  return (
    <>
      {/* Desktop */}
      <nav className="hidden items-center gap-1 sm:flex">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="btn-ghost border-0 hover:bg-slate-100">
            {l.label}
          </Link>
        ))}
        {isLoggedIn ? (
          <div className="flex items-center gap-2">
            {name && <span className="hidden text-sm text-slate-500 lg:inline">{name}</span>}
            <SignOutButton />
          </div>
        ) : (
          <Link href="/login" className="btn-primary">
            התחברות
          </Link>
        )}
      </nav>

      {/* Mobile */}
      <div className="sm:hidden">
        {isLoggedIn ? (
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="תפריט"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        ) : (
          <Link href="/login" className="btn-primary !px-3 !py-2 text-sm">
            התחברות
          </Link>
        )}

        {open && isLoggedIn && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute left-3 right-3 top-16 z-50 animate-[fadeIn_.2s_ease] rounded-2xl border border-slate-100 bg-white p-2 shadow-soft">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-3 text-right font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {l.label}
                </Link>
              ))}
              {name && <div className="px-4 py-2 text-xs text-slate-400">{name}</div>}
              <div className="px-2 pt-1">
                <SignOutButton />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
