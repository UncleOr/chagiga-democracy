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

export function dateHe(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
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
