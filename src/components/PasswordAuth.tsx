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

      {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
      {info && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
        {loading ? "רגע..." : mode === "signup" ? "הרשמה" : "התחברות"}
      </button>

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
