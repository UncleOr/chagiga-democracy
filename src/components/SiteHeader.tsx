import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";

export async function SiteHeader() {
  const profile = await getProfile();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-extrabold">
          <span className="text-2xl">🗳️</span>
          <span className="hidden sm:inline">חגיגה של דמוקרטיה</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link href="/" className="btn-ghost border-0 hover:bg-slate-100">
            טבלה
          </Link>
          <Link href="/takanon" className="btn-ghost border-0 hover:bg-slate-100">
            תקנון
          </Link>
          {profile && (
            <Link href="/me" className="btn-ghost border-0 hover:bg-slate-100">
              ההימור שלי
            </Link>
          )}
          {profile?.is_admin && (
            <Link href="/admin" className="btn-ghost border-0 hover:bg-slate-100">
              ניהול
            </Link>
          )}
          {profile ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-slate-500 sm:inline">
                {profile.display_name || profile.email}
              </span>
              <SignOutButton />
            </div>
          ) : (
            <Link href="/login" className="btn-primary">
              התחברות
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
