import Link from "next/link";

const GAMES = [
  {
    icon: "🎯",
    title: "המשחק הבסיסי",
    text: "מנחשים כמה מנדטים תקבל כל מפלגה. ככל שאתם קרובים יותר — זוכים בחלק גדול יותר מהקופה.",
  },
  {
    icon: "🥇",
    title: "הימור הזהב",
    text: "מי שסך הטעויות שלו (ה”פסילות”) הכי נמוך — לוקח את רוב הקופה. דיוק כללי משתלם.",
  },
  {
    icon: "🔫",
    title: "בונוס צלפים",
    text: "פרס מיוחד למי שקלע במדויק להכי הרבה מפלגות. תוספת קטנה, ריגוש גדול.",
  },
  {
    icon: "⚖️",
    title: "עוברת או לא",
    text: "מנחשים אילו מפלגות קטנות יעברו את אחוז החסימה — ומתחלקים בקופה על כל ניחוש נכון.",
  },
];

export function HowItWorks() {
  return (
    <details className="card group overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5">
        <span className="flex items-center gap-2 text-lg font-extrabold">
          <span>👋</span> ברוכים הבאים — ככה זה עובד
        </span>
        <span className="text-sm text-slate-400 transition group-open:rotate-180">▾</span>
      </summary>
      <div className="space-y-4 px-5 pb-5">
        <p className="text-sm leading-relaxed text-slate-600">
          מנחשים איך ייראו תוצאות הבחירות, מהמרים <b>50 ₪</b>, וכל הכסף מתחלק בין המנצחים. אפשר
          לשחק ארבעה משחקים במקביל — כל אחד עם קופה משלו:
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {GAMES.map((g) => (
            <div key={g.title} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
              <div className="text-2xl">{g.icon}</div>
              <div>
                <div className="font-bold">{g.title}</div>
                <div className="text-sm text-slate-500">{g.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-slate-500">💳 משלמים בפייבוקס אחרי ההימור · 🏆 הזוכים מקבלים את הקופה</span>
          <Link href="/takanon" className="font-semibold text-brand-600 hover:underline">
            לתקנון המלא והדוגמאות →
          </Link>
        </div>
      </div>
    </details>
  );
}
