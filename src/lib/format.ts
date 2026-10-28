export function ils(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 2,
  }).format(rounded);
}

export function ilsShort(n: number): string {
  return `${(Math.round(n * 100) / 100).toLocaleString("he-IL")} ₪`;
}

const IL_TZ = "Asia/Jerusalem";

export function dateHe(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: IL_TZ,
  }).format(new Date(iso));
}

/** Short day + time in Israel time, e.g. "28.10, 21:05" — for "updated at" stamps. */
export function dateTimeHe(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: IL_TZ,
  }).format(new Date(iso));
}

/** Human label + badge text for the current results mode. */
export function resultsModeLabel(
  mode: "samples" | "live" | "final",
  pct?: number | null,
): { title: string; badge: string; final: boolean } {
  switch (mode) {
    case "final":
      return { title: "תוצאות הבחירות", badge: "סופי", final: true };
    case "live":
      return {
        title: "תוצאות חלקיות",
        badge: pct != null ? `ספירת ${pct}% מהקולות` : "מתוצאות אמת",
        final: false,
      };
    case "samples":
    default:
      return { title: "תוצאות זמניות", badge: "ממוצע כל המדגמים", final: false };
  }
}

export function statusLabel(status: string): string {
  return (
    {
      draft: "טיוטה",
      open: "פתוח להימורים",
      closed: "ההימורים נסגרו",
      settled: "תוצאות סופיות",
    }[status] ?? status
  );
}
