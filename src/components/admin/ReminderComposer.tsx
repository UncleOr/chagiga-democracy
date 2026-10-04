"use client";

import { useMemo, useState } from "react";
import {
  AUDIENCES,
  defaultTemplate,
  reminderEmailHtml,
  type Audience,
} from "@/lib/emailTemplates";
import type { ReminderResult } from "@/lib/actions/admin";

const SAMPLE_NAME = "ישראל ישראלי";

export function ReminderComposer({
  counts,
  emailConfigured,
  send,
}: {
  counts: Record<Audience, number>;
  emailConfigured: boolean;
  send: (formData: FormData) => Promise<ReminderResult>;
}) {
  const [audience, setAudience] = useState<Audience>("unpaid");
  const initial = defaultTemplate("unpaid");
  const [subject, setSubject] = useState(initial.subject);
  const [body, setBody] = useState(initial.body);
  const [ctaLabel, setCtaLabel] = useState(initial.ctaLabel);
  const [ctaPath, setCtaPath] = useState(initial.ctaPath);
  const [dirty, setDirty] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<ReminderResult | null>(null);

  function applyTemplate(a: Audience) {
    const t = defaultTemplate(a);
    setSubject(t.subject);
    setBody(t.body);
    setCtaLabel(t.ctaLabel);
    setCtaPath(t.ctaPath);
    setDirty(false);
    setResult(null);
  }

  function pickAudience(a: Audience) {
    setAudience(a);
    setResult(null);
    if (!dirty) applyTemplate(a); // keep the admin's edits if they touched anything
  }

  const previewHtml = useMemo(
    () =>
      reminderEmailHtml({
        body,
        ctaLabel,
        ctaUrl: "#",
        name: SAMPLE_NAME,
      }),
    [body, ctaLabel],
  );

  const count = counts[audience] ?? 0;

  async function onSend() {
    setResult(null);
    if (!emailConfigured) {
      setResult({ ok: false, sent: 0, failed: 0, total: 0, error: "שליחת מיילים לא מוגדרת (חסר RESEND_API_KEY)." });
      return;
    }
    const audLabel = AUDIENCES.find((a) => a.key === audience)?.label ?? "";
    if (!window.confirm(`לשלוח את המייל ל־${count} נמענים (${audLabel})?`)) return;

    const fd = new FormData();
    fd.set("audience", audience);
    fd.set("subject", subject);
    fd.set("body", body);
    fd.set("ctaLabel", ctaLabel);
    fd.set("ctaPath", ctaPath);
    setSending(true);
    try {
      const res = await send(fd);
      setResult(res);
    } catch {
      setResult({ ok: false, sent: 0, failed: 0, total: 0, error: "שגיאה בשליחה." });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      {!emailConfigured && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
          ⚠️ שליחת מיילים עדיין לא מוגדרת. יש להוסיף <code>RESEND_API_KEY</code> (ורצוי{" "}
          <code>EMAIL_FROM</code> עם דומיין מאומת) במשתני הסביבה ולפרוס מחדש.
        </p>
      )}

      {/* Audience */}
      <div className="card p-4">
        <label className="label mb-2">למי לשלוח?</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {AUDIENCES.map((a) => {
            const active = a.key === audience;
            return (
              <button
                key={a.key}
                type="button"
                onClick={() => pickAudience(a.key)}
                className={`rounded-xl border p-3 text-right transition ${
                  active ? "border-brand-400 bg-brand-50" : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-sm font-semibold">{a.label}</span>
                  <span
                    className={`text-lg font-extrabold tabular-nums ${active ? "text-brand-700" : "text-slate-400"}`}
                  >
                    {counts[a.key] ?? 0}
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] leading-tight text-slate-400">{a.hint}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Composer + preview */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">עריכת ההודעה</h3>
            <button
              type="button"
              onClick={() => applyTemplate(audience)}
              className="btn-ghost !px-3 !py-1.5 text-xs"
              title="החזרת הטקסט לטמפלייט המקורי של הקהל הנבחר"
            >
              ↺ טען טמפלייט
            </button>
          </div>

          <div>
            <label className="label text-xs">נושא</label>
            <input
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setDirty(true);
              }}
              className="input"
            />
          </div>

          <div>
            <label className="label text-xs">תוכן ההודעה</label>
            <textarea
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                setDirty(true);
              }}
              rows={9}
              className="input font-normal leading-relaxed"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              <code>{"{name}"}</code> יוחלף בכינוי של כל נמען · קישור נכתב כך:{" "}
              <code>{"[טקסט](https://...)"}</code> · ירידות שורה נשמרות.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label text-xs">כיתוב הכפתור</label>
              <input
                value={ctaLabel}
                onChange={(e) => {
                  setCtaLabel(e.target.value);
                  setDirty(true);
                }}
                placeholder="(ריק = בלי כפתור)"
                className="input"
              />
            </div>
            <div>
              <label className="label text-xs">יעד הכפתור</label>
              <input
                value={ctaPath}
                onChange={(e) => {
                  setCtaPath(e.target.value);
                  setDirty(true);
                }}
                placeholder="/me"
                className="input text-left"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="card p-4">
          <h3 className="mb-3 font-bold">תצוגה מקדימה</h3>
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="overflow-hidden rounded-xl bg-white p-3 shadow-card">
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          </div>
        </div>
      </div>

      {/* Send */}
      <div className="sticky bottom-3 z-10">
        <div className="card flex flex-wrap items-center justify-between gap-3 p-4 shadow-soft">
          <div className="text-sm">
            <span className="text-slate-400">יישלח אל </span>
            <span className="font-bold">{count}</span>
            <span className="text-slate-400"> נמענים</span>
            {result && (
              <span className={`ms-3 font-semibold ${result.ok ? "text-green-600" : "text-amber-600"}`}>
                {result.total === 0 && result.error
                  ? `⚠️ ${result.error}`
                  : `✓ נשלחו ${result.sent}${result.failed ? ` · נכשלו ${result.failed}` : ""}`}
                {result.failed > 0 && result.error && (
                  <span className="block text-xs font-normal text-amber-600/90">סיבה: {result.error}</span>
                )}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onSend}
            disabled={sending || count === 0}
            className="btn-primary px-6 py-3 disabled:opacity-50"
          >
            {sending ? "שולח..." : `📧 שליחה ל־${count}`}
          </button>
        </div>
      </div>
    </div>
  );
}
