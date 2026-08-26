"use client";

import { useEffect, useState } from "react";

export function ShareButtons({
  label = "הזמינו חברים",
  message = "בואו לנחש את תוצאות הבחירות ולזכות בקופה! 🗳️ חגיגה של דמוקרטיה",
  compact = false,
}: {
  label?: string;
  message?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  function url() {
    const base = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
    return base;
  }

  function whatsapp() {
    const text = encodeURIComponent(`${message}\n${url()}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${message}\n${url()}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "חגיגה של דמוקרטיה", text: message, url: url() });
      } catch {
        /* user cancelled */
      }
    } else {
      copy();
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? "" : "text-sm"}`}>
      {!compact && <span className="font-semibold text-slate-600">{label}:</span>}
      <button
        onClick={whatsapp}
        className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-2 text-sm font-semibold text-white transition hover:brightness-105 active:scale-95"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17.5 14.4c-.3-.15-1.7-.85-2-.95-.25-.1-.45-.15-.65.15s-.75.95-.9 1.15c-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.4-1.47-.9-.8-1.5-1.78-1.67-2.08-.17-.3 0-.46.13-.6.13-.14.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.65-1.57-.9-2.15-.24-.56-.48-.48-.65-.5h-.55c-.2 0-.5.07-.77.37-.26.3-1 1-1 2.42s1.03 2.8 1.17 3c.15.2 2.03 3.1 4.9 4.35.69.3 1.22.48 1.64.6.69.22 1.32.19 1.82.12.55-.08 1.7-.7 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.27-.2-.57-.35zM12 2a10 10 0 0 0-8.6 15.05L2 22l5.05-1.32A10 10 0 1 0 12 2z" />
        </svg>
        וואטסאפ
      </button>
      <button
        onClick={copy}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95"
      >
        {copied ? "✓ הועתק" : "🔗 העתקת קישור"}
      </button>
      {canShare && (
        <button
          onClick={nativeShare}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95"
        >
          שיתוף…
        </button>
      )}
    </div>
  );
}
