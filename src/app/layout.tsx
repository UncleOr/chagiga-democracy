import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { supabaseConfigured } from "@/lib/supabase/config";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://chagiga-democracy-swart.vercel.app";
const DESCRIPTION =
  "משחק ניחושי הבחירות בין חברים — ניחוש מנדטים, הימור זהב, בונוס צלפים ועוברת או לא.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "חגיגה של דמוקרטיה",
  description: DESCRIPTION,
  openGraph: {
    title: "חגיגה של דמוקרטיה",
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "חגיגה של דמוקרטיה",
    locale: "he_IL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "חגיגה של דמוקרטיה",
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="font-sans antialiased">
        <SiteHeader />
        {!supabaseConfigured && (
          <div className="bg-amber-50 text-amber-800">
            <div className="mx-auto max-w-6xl px-4 py-2 text-center text-sm">
              ⚙️ האתר עדיין לא חובר למסד הנתונים. יש להזין את פרטי ה־Supabase במשתני הסביבה ולפרוס מחדש.
            </div>
          </div>
        )}
        <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6">{children}</main>
      </body>
    </html>
  );
}
