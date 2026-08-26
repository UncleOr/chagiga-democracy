"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateNickname } from "@/lib/actions/profile";

export function NicknameCard({ current }: { current: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(current ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty = value.trim() !== (current ?? "").trim();

  async function save(formData: FormData) {
    setSaving(true);
    setMsg(null);
    const res = await updateNickname(null, formData);
    setSaving(false);
    if (!res.ok) setMsg({ ok: false, text: res.error ?? "שגיאה" });
    else {
      setMsg({ ok: true, text: "הכינוי נשמר ✓" });
      router.refresh();
    }
  }

  return (
    <form action={save} className="card p-5">
      <label className="label" htmlFor="nickname">
        הכינוי שלי <span className="font-normal text-slate-400">(יוצג בטבלה לכל המשתתפים)</span>
      </label>
      <div className="flex gap-2">
        <input
          id="nickname"
          name="nickname"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={40}
          placeholder="איך שיקראו לך בטבלה"
          className="input flex-1"
        />
        <button type="submit" disabled={saving || !dirty || value.trim().length < 2} className="btn-primary px-5">
          {saving ? "שומר..." : "שמירה"}
        </button>
      </div>
      {!current && (
        <p className="mt-2 text-sm text-amber-600">כדאי להגדיר כינוי לפני שמהמרים — הוא יופיע בטבלה.</p>
      )}
      {msg && (
        <p className={`mt-2 text-sm ${msg.ok ? "text-green-600" : "text-red-600"}`}>{msg.text}</p>
      )}
    </form>
  );
}
