import { ilsShort } from "@/lib/format";

export function PotsBar({
  participants,
  mandatePot,
  goldPot,
  sniperPot,
  passfailPot,
}: {
  participants: number;
  mandatePot: number;
  goldPot: number;
  sniperPot: number;
  passfailPot: number;
}) {
  const items = [
    { label: "משתתפים פעילים", value: participants.toString(), accent: "text-slate-900" },
    { label: "קופת מנדטים", value: ilsShort(mandatePot), accent: "text-brand-700" },
    { label: "הימור זהב", value: ilsShort(goldPot), accent: "text-gold-600" },
    { label: "בונוס צלפים", value: ilsShort(sniperPot), accent: "text-slate-900" },
    { label: "עוברת או לא", value: ilsShort(passfailPot), accent: "text-slate-900" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((it) => (
        <div key={it.label} className="card p-4">
          <div className="text-xs text-slate-400">{it.label}</div>
          <div className={`mt-1 text-xl font-extrabold ${it.accent}`}>{it.value}</div>
        </div>
      ))}
    </div>
  );
}
