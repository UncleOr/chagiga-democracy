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
  const total = mandatePot + goldPot + sniperPot + passfailPot;
  const items = [
    { icon: "👥", label: "משתתפים פעילים", value: participants.toString(), accent: "text-slate-900" },
    { icon: "🗳️", label: "קופת מנדטים", value: ilsShort(mandatePot), accent: "text-brand-700" },
    { icon: "🥇", label: "הימור זהב", value: ilsShort(goldPot), accent: "text-gold-600" },
    { icon: "🎯", label: "בונוס צלפים", value: ilsShort(sniperPot), accent: "text-teal-600" },
    { icon: "⚖️", label: "עוברת או לא", value: ilsShort(passfailPot), accent: "text-slate-900" },
  ];
  return (
    <div className="space-y-3">
      {/* Grand total — the headline number */}
      <div className="relative overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-l from-brand-600 to-brand-800 p-5 text-white shadow-soft">
        <div className="absolute -left-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 left-16 h-28 w-28 rounded-full bg-gold-400/20" />
        <div className="relative flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-white/70">💰 סך הכל בקופה</div>
            <div className="mt-0.5 text-3xl font-extrabold tabular-nums sm:text-4xl">{ilsShort(total)}</div>
          </div>
          <div className="text-5xl opacity-80 sm:text-6xl">🏆</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((it) => (
          <div key={it.label} className="card p-4 transition hover:-translate-y-0.5 hover:shadow-soft">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-sm">{it.icon}</span>
              {it.label}
            </div>
            <div className={`mt-1 text-xl font-extrabold ${it.accent}`}>{it.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
