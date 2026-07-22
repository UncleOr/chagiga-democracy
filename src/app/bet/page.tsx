import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getActiveRound, getParties, getMyBid } from "@/lib/data";
import { BetForm } from "@/components/BetForm";

export default async function BetPage() {
  const profile = await requireUser();
  const round = await getActiveRound();

  if (!round) {
    return <EmptyState title="אין סבב פעיל" body="עדיין לא נפתח סבב הימורים. חזרו בקרוב!" />;
  }
  if (round.status !== "open") {
    return (
      <EmptyState
        title="ההימורים סגורים"
        body="לא ניתן להמר או לערוך כעת. אפשר לצפות בטבלת המשתתפים ובתוצאות."
      />
    );
  }

  const [parties, existing] = await Promise.all([
    getParties(round.id),
    getMyBid(round.id, profile.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold">{existing ? "עריכת ההימור" : "הימור חדש"}</h1>
        <p className="text-sm text-slate-500">{round.name}</p>
      </div>
      <BetForm round={round} parties={parties} existing={existing} />
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto mt-12 max-w-md text-center">
      <div className="card p-8">
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{body}</p>
        <Link href="/" className="btn-primary mt-5">
          לטבלת המשתתפים
        </Link>
      </div>
    </div>
  );
}
