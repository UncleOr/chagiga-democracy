"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (password.length < 6) return setMsg({ ok: false, text: "הסיסמה חייבת להכיל לפחות 6 תווים." });
    if (password !== password2) return setMsg({ ok: false, text: "הסיסמאות אינן תואמות." });
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setMsg({
        ok: false,
        text: /session|Auth session missing/i.test(error.message)
          ? "הקישור פג או שאינכם מחוברים. בקשו איפוס סיסמה מחדש."
          : error.message,
      });
      return;
    }
    setMsg({ ok: true, text: "הסיסמה עודכנה! מעבירים אתכם…" });
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 1200);
  }

  return (
    <div className="mx-auto mt-10 max-w-md">
      <div className="card p-8">
        <h1 className="text-2xl font-extrabold">בחירת סיסמה חדשה</h1>
        <p className="mt-1 text-sm text-slate-500">הזינו סיסמה חדשה לחשבון שלכם.</p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <div>
            <label className="label">סיסמה חדשה</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              dir="ltr"
              autoComplete="new-password"
              required
            />
          </div>
          <div>
            <label className="label">אימות סיסמה</label>
            <input
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              className="input"
              dir="ltr"
              autoComplete="new-password"
              required
            />
          </div>
          {msg && (
            <p className={`rounded-xl px-3 py-2 text-sm ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
              {msg.text}
            </p>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? "שומר…" : "עדכון סיסמה"}
          </button>
        </form>
      </div>
    </div>
  );
}
