"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const KEY = "chagiga_onboarded_v1";

const SLIDES = [
  {
    emoji: "🗳️",
    title: "ברוכים הבאים לחגיגה של דמוקרטיה",
    text: "משחק ניחושי הבחירות בין חברים. מנחשים איך ייראו התוצאות, מהמרים 50 ₪ — והזוכים חולקים את הקופה.",
  },
  {
    emoji: "🎯",
    title: "ארבעה משחקים, קופה אחת",
    text: "ניחוש מנדטים לכל מפלגה, הימור זהב על הדיוק הכללי, בונוס צלפים לקליעות מדויקות, ו״עוברת או לא״ על אחוז החסימה.",
  },
  {
    emoji: "🧭",
    title: "מפת הגושים והסקרים",
    text: "בזמן שאתם ממלאים תראו כמה מנדטים נתתם לכל גוש, ובדשבורד תוכלו להשוות את ההימורים לסקרי החדשות העדכניים.",
  },
  {
    emoji: "💳",
    title: "ממלאים, משלמים, מנצחים",
    text: "אחרי ההימור משלמים בפייבוקס ומסמנים ״שילמתי״. ככל שיותר חברים משחקים — הקופה גדולה יותר!",
  },
];

export function OnboardingModal() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* storage blocked — just don't show */
    }
  }, []);

  function close() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  function finish() {
    close();
    router.push("/login?next=/bet");
  }

  if (!show) return null;
  const last = i === SLIDES.length - 1;
  const s = SLIDES[i];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-sm">
      <div className="animate-[fadeIn_.3s_ease] max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {SLIDES.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-brand-600" : "w-1.5 bg-slate-200"}`}
              />
            ))}
          </div>
          <button onClick={close} className="text-sm text-slate-400 hover:text-slate-600">
            דלג
          </button>
        </div>

        <div key={i} className="animate-[fadeIn_.3s_ease] py-5 text-center">
          <div className="text-5xl">{s.emoji}</div>
          <h2 className="mt-3 text-lg font-extrabold sm:text-xl">{s.title}</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-500">{s.text}</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          {i > 0 ? (
            <button onClick={() => setI(i - 1)} className="btn-ghost">
              →
            </button>
          ) : (
            <span />
          )}
          {last ? (
            <button onClick={finish} className="btn-primary flex-1 py-3 text-base">
              בואו נתחיל 🚀
            </button>
          ) : (
            <button onClick={() => setI(i + 1)} className="btn-primary flex-1 py-3 text-base">
              הבא
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
