import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { HeaderNav } from "@/components/HeaderNav";

export async function SiteHeader() {
  const profile = await getProfile();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-extrabold">
          <span className="text-2xl">🗳️</span>
          <span className="hidden sm:inline">חגיגה של דמוקרטיה</span>
        </Link>

        <HeaderNav
          isLoggedIn={!!profile}
          isAdmin={!!profile?.is_admin}
          name={profile?.display_name || profile?.email || null}
        />
      </div>
    </header>
  );
}
