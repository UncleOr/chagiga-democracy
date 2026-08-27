import Link from "next/link";

export const metadata = { title: "מדיניות פרטיות · חגיגה של דמוקרטיה" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-6">
      <h2 className="mb-3 text-lg font-extrabold text-brand-700">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="text-center">
        <div className="text-4xl">🔒</div>
        <h1 className="mt-2 text-3xl font-extrabold">מדיניות פרטיות</h1>
        <p className="mt-1 text-sm text-slate-500">
          איזה מידע נאסף ב“חגיגה של דמוקרטיה”, מה גלוי לאחרים, ומה נשמר פרטי.
        </p>
      </div>

      <Section title="איזה מידע נאסף">
        <ul className="list-disc space-y-1.5 pr-5 marker:text-slate-400">
          <li>
            <b>כתובת אימייל</b> — לצורך התחברות, זיהוי, ושליחת פרטי תשלום. מי שמתחבר עם Google — האימייל
            והשם מגיעים מחשבון Google.
          </li>
          <li>
            <b>כינוי</b> — השם שבחרתם להצגה בטבלה.
          </li>
          <li>
            <b>ההימור שלכם</b> — ניחושי המנדטים והתוספות שבחרתם.
          </li>
          <li>
            <b>סטטוס תשלום</b> — סימון אם שילמתם (התשלום עצמו מתבצע בפייבוקס, מחוץ לאפליקציה — איננו
            אוספים או שומרים פרטי אמצעי תשלום).
          </li>
        </ul>
      </Section>

      <Section title="מה גלוי לאחרים">
        <p>
          <b>הכינוי וההימור</b> (ניחושי המנדטים והתוספות) גלויים לכל המשתתפים — זה חלק מהמשחק (תקנון
          2.6).
        </p>
        <p>
          <b>כתובת האימייל שלכם לעולם אינה מוצגת</b> לאף משתתף. היא נגישה רק למארגני המשחק לצורך ניהול.
        </p>
      </Section>

      <Section title="איך נעשה שימוש במידע">
        <ul className="list-disc space-y-1.5 pr-5 marker:text-slate-400">
          <li>הפעלת המשחק: חישוב תוצאות, קופות וזכיות.</li>
          <li>שליחת פרטי התשלום וקישור הפייבוקס לאימייל שלכם.</li>
          <li>יצירת קשר של המארגנים בנוגע למשחק בלבד.</li>
        </ul>
        <p className="text-slate-500">לא נמכור ולא נעביר את המידע לצדדים שלישיים לצרכים שיווקיים.</p>
      </Section>

      <Section title="היכן המידע נשמר">
        <p>
          הנתונים נשמרים בשירותי הענן שעליהם פועלת האפליקציה (Supabase לנתונים, Vercel לאירוח). המידע
          מוגן בהתאם לאמצעי האבטחה של ספקים אלו.
        </p>
      </Section>

      <Section title="שליטה במידע ומחיקה">
        <p>
          באזור האישי תוכלו בכל עת לערוך את הכינוי, לאפס את ההימור, או <b>למחוק לצמיתות את החשבון</b>{" "}
          כולל כל הנתונים הקשורים אליו.
        </p>
      </Section>

      <Section title="יצירת קשר">
        <p>בכל שאלה בנוגע לפרטיות ניתן לפנות למארגני המשחק.</p>
      </Section>

      <div className="text-center">
        <Link href="/" className="btn-ghost">
          ← חזרה לעמוד הבית
        </Link>
      </div>
    </div>
  );
}
