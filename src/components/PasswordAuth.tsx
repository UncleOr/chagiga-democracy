"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export function PasswordAuth({ next }: { next?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "signup") {
        if (name.trim().length < 2) throw new Error("יש להזין שם או כינוי (לפחות 2 תווים).");
        if (password.length < 6) throw new Error("הסיסמה חייבת להכיל לפחות 6 תווים.");
        if (password !== password2) throw new Error("הסיסמאות אינן תואמות.");
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: name.trim() } },
        });
        if (error) throw error;
        // If email confirmation is disabled, a session is returned immediately.
        if (!data.session) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          if (signInErr) {
            setInfo("נשלח אליכם מייל לאישור החשבון. אשרו אותו ואז התחברו.");
            setLoading(false);
            return;
          }
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
      router.push(next || "/");
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "אירעה שגיאה, נסו שוב.";
      setErr(
        /Invalid login/i.test(msg)
          ? "אימייל או סיסמה שגויים."
          : /already registered/i.test(msg)
            ? "המשתמש כבר קיים — התחברו במקום."
            : /at least 6/i.test(msg)
              ? "הסיסמה חייבת להכיל לפחות 6 תווים."
              : msg,
      );
      setLoading(false);
    }
  }

  async function forgot() {
    setErr(null);
    setInfo(null);
    if (!email.trim()) {
      setErr("הזינו אימייל למעלה ואז לחצו ״שכחתי סיסמה״.");
      return;
    }
    const supabase = createClient();
    const base = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${base}/auth/callback?next=/reset-password`,
    });
    if (error) setErr(error.message);
    else setInfo("נשלח מייל לאיפוס סיסמה. בדקו גם בתיקיית הספאם.");
  }

  return (
    <form onSubmit={submit} className="space-y-3 text-right">
      {mode === "signup" && (
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-600">שם / כינוי</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="הכינוי שיוצג בטבלה"
            className="input"
            autoComplete="nickname"
          />
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-600">אימייל</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="input"
          autoComplete="email"
          dir="ltr"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-600">סיסמה</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="לפחות 6 תווים"
          className="input"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          dir="ltr"
        />
      </div>
      {mode === "signup" && (
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-600">אימות סיסמה</label>
          <input
            type="password"
            required
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            placeholder="הקלידו שוב את הסיסמה"
            className={`input ${password2 && password2 !== password ? "border-red-300" : ""}`}
            autoComplete="new-password"
            dir="ltr"
          />
        </div>
      )}

      {err &&<p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
      {info && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
        {loading ? "רגע..." : mode === "signup" ? "הרשמה" : "התחברות"}
      </button>

      {mode === "signin" && (
        <div className="text-center">
          <button type="button" onClick={forgot} className="text-xs text-slate-400 hover:underline">
            שכחתי סיסמה
          </button>
        </div>
      )}

      <p className="pt-1 text-center text-sm text-slate-500">
        {mode === "signup" ? "כבר יש לכם חשבון?" : "עדיין אין לכם חשבון?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signup" ? "signin" : "signup");
            setErr(null);
            setInfo(null);
          }}
          className="font-semibold text-brand-600 hover:underline"
        >
          {mode === "signup" ? "התחברו" : "הירשמו"}
        </button>
      </p>
    </form>
  );
}
