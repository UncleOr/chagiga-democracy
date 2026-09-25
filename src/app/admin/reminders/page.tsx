import { getAllProfiles, getActiveRound, getAdminBids } from "@/lib/data";
import { sendReminders } from "@/lib/actions/admin";
import { ReminderComposer } from "@/components/admin/ReminderComposer";
import type { Audience } from "@/lib/emailTemplates";

export default async function AdminReminders() {
  const [profiles, round] = await Promise.all([getAllProfiles(), getActiveRound()]);
  const bids = round ? await getAdminBids(round.id) : [];
  const bidByEmail = new Map(bids.map((b) => [b.email, b]));

  const active = profiles.filter((p) => !p.banned && !!p.email);
  const counts: Record<Audience, number> = { all: 0, bet: 0, unpaid: 0, nobet: 0 };
  for (const p of active) {
    const b = bidByEmail.get(p.email);
    counts.all++;
    if (b) {
      counts.bet++;
      if (!b.paid) counts.unpaid++;
    } else {
      counts.nobet++;
    }
  }

  const emailConfigured = !!process.env.RESEND_API_KEY;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-bold">דיוור ותזכורות</h2>
        <p className="text-sm text-slate-400">
          בוחרים קהל, עורכים טמפלייט מוכן ושולחים. כל נמען מקבל מייל אישי עם הכינוי שלו.
        </p>
      </div>
      <ReminderComposer counts={counts} emailConfigured={emailConfigured} send={sendReminders} />
    </div>
  );
}
