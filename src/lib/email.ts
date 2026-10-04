import "server-only";
import { telegramEmailHtml } from "@/lib/emailTemplates";

/**
 * Sends a transactional email via Resend's HTTP API.
 * No-ops silently if RESEND_API_KEY is not configured, so the app works
 * without email until a key is added (Vercel env → redeploy).
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY לא מוגדר" };
  const from = process.env.EMAIL_FROM || "חגיגה של דמוקרטיה <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, html: opts.html }),
    });
    if (res.ok) return { ok: true };
    // Surface Resend's own message so misconfig (unverified domain, test-mode
    // recipient restriction, bad key) is diagnosable instead of a silent fail.
    let msg = `Resend ${res.status}`;
    try {
      const j = (await res.json()) as { message?: string; name?: string };
      if (j?.message) msg = j.message;
      else if (j?.name) msg = j.name;
    } catch {
      /* ignore parse errors */
    }
    return { ok: false, error: msg };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "שגיאת רשת" };
  }
}

export function paymentEmailHtml(o: {
  nickname: string;
  amount: number;
  payboxUrl: string | null;
  siteUrl: string;
}): string {
  const pay = o.payboxUrl
    ? `<a href="${o.payboxUrl}" style="display:inline-block;background:#1e40f5;color:#fff;text-decoration:none;padding:12px 22px;border-radius:12px;font-weight:700">לתשלום ב־PayBox ←</a>`
    : `<span style="color:#64748b">קישור התשלום יישלח בהמשך.</span>`;
  return `
  <div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:auto;color:#131b2e">
    <div style="background:#1e40f5;color:#fff;border-radius:16px;padding:22px;text-align:center">
      <div style="font-size:26px;font-weight:800">🗳️ חגיגה של דמוקרטיה</div>
    </div>
    <div style="padding:22px 6px">
      <p>היי ${o.nickname}, ההימור שלך נקלט! 🎉</p>
      <p>כדי להיות משתתפים פעילים נותר רק לשלם:</p>
      <p style="font-size:30px;font-weight:800;margin:6px 0">${o.amount} ₪</p>
      <p style="margin:18px 0">${pay}</p>
      <p style="color:#64748b;font-size:13px">אחרי התשלום, סמנו “כבר שילמתי” באזור האישי כדי שנאשר אתכם.</p>
      <p style="margin-top:20px"><a href="${o.siteUrl}/me" style="color:#1e40f5">לאזור האישי שלי →</a></p>
      ${telegramEmailHtml()}
    </div>
  </div>`;
}
