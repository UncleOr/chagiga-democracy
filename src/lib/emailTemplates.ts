/**
 * Shared email content — used both for the live preview in the admin composer
 * (client) and for the actual send (server). No "server-only" here on purpose.
 */

export type Audience = "all" | "bet" | "unpaid" | "nobet";

export const TELEGRAM_CHANNEL = "https://t.me/+T7EodpplzjYXohmp";
export const TELEGRAM_GROUP = "https://t.me/+FpRlslr2W9gaK2fJ";

/** Plain-text Telegram invite block (supports [text](url) links in email bodies). */
export const TELEGRAM_BODY =
  `רוצים להישאר מעודכנים? [הצטרפו לערוץ הטלגרם שלנו כאן](${TELEGRAM_CHANNEL})\n` +
  `רוצים לדבר על ההימור שלכם בקבוצה החופרת? [בואו](${TELEGRAM_GROUP})`;

/** Ready-made HTML block for the Telegram invites (used in transactional emails). */
export function telegramEmailHtml(): string {
  return `
  <div style="margin-top:4px;padding:14px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;font-size:13px;line-height:1.7">
    <p style="margin:0">רוצים להישאר מעודכנים? <a href="${TELEGRAM_CHANNEL}" style="color:#1e40f5;font-weight:600">הצטרפו לערוץ הטלגרם שלנו כאן</a></p>
    <p style="margin:6px 0 0">רוצים לדבר על ההימור שלכם בקבוצה החופרת? <a href="${TELEGRAM_GROUP}" style="color:#1e40f5;font-weight:600">בואו</a></p>
  </div>`;
}

export const AUDIENCES: { key: Audience; label: string; hint: string }[] = [
  { key: "all", label: "כל הרשומים", hint: "כל מי שנרשם לאתר" },
  { key: "bet", label: "הימרו ושילמו", hint: "שלחו הימור והתשלום אושר" },
  { key: "unpaid", label: "הימרו ולא שילמו", hint: "שלחו הימור אך התשלום טרם אושר" },
  { key: "nobet", label: "נרשמו ולא הימרו", hint: "נרשמו אך עוד לא שלחו הימור" },
];

export interface ReminderTemplate {
  subject: string;
  /** Plain text. Newlines become line breaks. Use {name} for the nickname. */
  body: string;
  ctaLabel: string;
  /** Path on the site, e.g. "/bet" or "/me". Combined with the site URL. */
  ctaPath: string;
}

export function defaultTemplate(audience: Audience): ReminderTemplate {
  const withTelegram = (t: ReminderTemplate): ReminderTemplate => ({
    ...t,
    body: `${t.body}\n\n${TELEGRAM_BODY}`,
  });
  switch (audience) {
    case "bet":
      return withTelegram({
        subject: "תזכורת קטנה מחגיגה של דמוקרטיה 🗳️",
        body:
          "היי {name},\n\n" +
          "רק רצינו להזכיר שההימור שלך נקלט אצלנו — תודה שאתם משחקים!\n" +
          "אפשר להיכנס בכל רגע כדי לעדכן את הניחושים לפני שהרשימות נסגרות ולראות איך אתם מול שאר המשתתפים.\n\n" +
          "בהצלחה, ושתנצח הדמוקרטיה 🎉",
        ctaLabel: "לאזור האישי שלי ←",
        ctaPath: "/me",
      });
    case "unpaid":
      return withTelegram({
        subject: "רק נותר לשלם — חגיגה של דמוקרטיה 💰",
        body:
          "היי {name},\n\n" +
          "ההימור שלך אצלנו, אבל התשלום עוד לא הושלם. כדי להיכנס לחישוב הזכיות צריך רק לסגור את התשלום ב־PayBox.\n" +
          "אחרי התשלום סמנו “כבר שילמתי” באזור האישי ונאשר אתכם.\n\n" +
          "תודה, וניפגש בקלפי 🗳️",
        ctaLabel: "לתשלום ולאזור האישי ←",
        ctaPath: "/me",
      });
    case "nobet":
      return withTelegram({
        subject: "עוד לא הימרת? הרשימות עומדות להיסגר ⏳",
        body:
          "היי {name},\n\n" +
          "נרשמת לחגיגה של דמוקרטיה אבל עוד לא שלחת הימור.\n" +
          "זה לוקח שתי דקות: מנחשים כמה מנדטים תקבל כל מפלגה, מוסיפים בונוסים אם בא לכם — וזהו, אתם במשחק.\n\n" +
          "אל תפספסו, זה הזמן 🎯",
        ctaLabel: "להימור שלי ←",
        ctaPath: "/bet",
      });
    case "all":
    default:
      return withTelegram({
        subject: "עדכון מחגיגה של דמוקרטיה 🗳️",
        body:
          "היי {name},\n\n" +
          "רצינו לעדכן אתכם בכמה דברים חשובים לקראת הבחירות.\n" +
          "כנסו לאתר לפרטים המלאים ולעדכון ההימור לפני סגירת הרשימות.\n\n" +
          "נתראה בחגיגה 🎉",
        ctaLabel: "לאתר ←",
        ctaPath: "/",
      });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Builds the branded HTML for a reminder. `name` replaces the {name} placeholder. */
export function reminderEmailHtml(o: {
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  name: string;
}): string {
  const bodyHtml = escapeHtml(o.body)
    .replace(/\{name\}/g, escapeHtml(o.name))
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
      '<a href="$2" style="color:#1e40f5;font-weight:600">$1</a>',
    )
    .replace(/\n/g, "<br/>");
  const cta = o.ctaLabel.trim()
    ? `<p style="margin:22px 0 6px"><a href="${o.ctaUrl}" style="display:inline-block;background:#1e40f5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:700">${escapeHtml(
        o.ctaLabel,
      )}</a></p>`
    : "";
  return `
  <div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:auto;color:#131b2e">
    <div style="background:#1e40f5;color:#fff;border-radius:16px;padding:22px;text-align:center">
      <div style="font-size:26px;font-weight:800">🗳️ חגיגה של דמוקרטיה</div>
    </div>
    <div style="padding:22px 6px;font-size:15px;line-height:1.7">
      <p style="margin:0">${bodyHtml}</p>
      ${cta}
    </div>
    <div style="border-top:1px solid #e2e8f0;margin-top:8px;padding:14px 6px;color:#94a3b8;font-size:12px;text-align:center">
      חגיגה של דמוקרטיה · הבחירות לכנסת ה־26
    </div>
  </div>`;
}
