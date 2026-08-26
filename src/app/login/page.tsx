import { PasswordAuth } from "@/components/PasswordAuth";
import { GoogleSignIn } from "@/components/GoogleSignIn";
import { getProfile } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  if (await getProfile()) redirect(next || "/");

  return (
    <div className="mx-auto mt-10 max-w-md">
      <div className="card p-8">
        <div className="text-center">
          <div className="mb-3 text-4xl">🗳️</div>
          <h1 className="text-2xl font-extrabold">חגיגה של דמוקרטיה</h1>
          <p className="mt-2 text-sm text-slate-500">
            התחברו כדי להמר על תוצאות הבחירות, לעקוב אחרי הקופות ולראות מי מוביל.
          </p>
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-600">
            ההתחברות נכשלה, נסו שוב.
          </p>
        )}

        <div className="mt-6">
          <GoogleSignIn next={next} />
        </div>

        <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          או עם אימייל וסיסמה
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <PasswordAuth next={next} />

        <p className="mt-6 text-center text-xs text-slate-400">
          לא נפרסם את כתובת המייל שלכם. בטבלה יוצג רק הכינוי שבחרתם.
        </p>
      </div>
    </div>
  );
}
