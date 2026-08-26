import Link from "next/link";

// step: 1 = need to bet, 2 = need to pay, 3 = done (active participant)
export function ProgressSteps({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "התחברות", done: true },
    { n: 2, label: "ממלאים הימור", done: step > 1 },
    { n: 3, label: "משלמים", done: step > 2 },
  ];

  return (
    <div className="card p-4">
      <div className="flex items-center gap-1">
        {steps.map((s, i) => {
          const isCurrent = (step === 1 && s.n === 2) || (step === 2 && s.n === 3);
          return (
            <div key={s.n} className="flex flex-1 items-center">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    s.done
                      ? "bg-green-500 text-white"
                      : isCurrent
                        ? "bg-brand-600 text-white"
                        : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {s.done ? "✓" : s.n}
                </span>
                <span
                  className={`text-xs font-semibold sm:text-sm ${
                    isCurrent ? "text-brand-700" : s.done ? "text-slate-600" : "text-slate-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <span className={`mx-2 h-0.5 flex-1 rounded ${s.done ? "bg-green-400" : "bg-slate-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      {step < 3 && (
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <span className="text-sm text-slate-500">
            {step === 1 ? "השלב הבא: מלאו את ניחוש המנדטים." : "כמעט שם! נותר רק לשלם ולסמן ״שילמתי״."}
          </span>
          <Link href={step === 1 ? "/bet" : "/me"} className="btn-primary shrink-0">
            {step === 1 ? "להימור →" : "לתשלום →"}
          </Link>
        </div>
      )}
      {step === 3 && (
        <div className="mt-3 border-t border-slate-100 pt-3 text-sm font-semibold text-green-700">
          🎉 אתם משתתפים פעילים! בהצלחה.
        </div>
      )}
    </div>
  );
}
