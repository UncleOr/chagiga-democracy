"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveRound, getParties } from "@/lib/data";
import { amountDue } from "@/lib/calc";
import { sendEmail, paymentEmailHtml } from "@/lib/email";

export interface SubmitBidResult {
  ok: boolean;
  error?: string;
  frozen?: boolean;
}

/** Create or update the current user's bid for the open round. */
export async function submitBid(_prev: unknown, formData: FormData): Promise<SubmitBidResult> {
  const profile = await requireUser();
  const round = await getActiveRound();
  if (!round) return { ok: false, error: "אין סבב פעיל." };
  if (round.status !== "open") return { ok: false, error: "ההימורים סגורים כרגע." };
  if (round.closes_at && new Date(round.closes_at) <= new Date())
    return { ok: false, error: "עבר המועד הקובע — ההימורים נסגרו." };

  const parties = await getParties(round.id);
  // Nickname comes from the profile (set in the personal area), not the bet form.
  const nickname = (profile.display_name ?? "").trim();
  if (!nickname)
    return { ok: false, error: "יש להגדיר כינוי באזור האישי לפני ההימור." };
  if (nickname.length > 40) return { ok: false, error: "הכינוי ארוך מדי." };

  const is_double = formData.get("is_double") === "on";
  const has_sniper = formData.get("has_sniper") === "on";
  const has_passfail = formData.get("has_passfail") === "on";

  // Parse seats
  const seats: { party_id: string; seats: number }[] = [];
  let hasThreeOrLess = false;
  for (const p of parties) {
    const raw = formData.get(`seat_${p.id}`);
    let n = Number(raw ?? 0);
    if (!Number.isFinite(n) || n < 0) n = 0;
    n = Math.floor(n);
    if (n > 120) n = 120;
    if (n >= 1 && n <= 3) hasThreeOrLess = true; // rule 3.1.4
    seats.push({ party_id: p.id, seats: n });
  }

  // Parse pass/fail (only when the add-on is chosen)
  const passfail: { party_id: string; predicted_pass: boolean }[] = [];
  if (has_passfail) {
    for (const p of parties.filter((x) => x.is_swing)) {
      const raw = formData.get(`pf_${p.id}`);
      if (raw === "pass" || raw === "fail") {
        passfail.push({ party_id: p.id, predicted_pass: raw === "pass" });
      }
    }
  }

  const amount_due = amountDue({ is_double, has_sniper, has_passfail }, round);
  const frozen = hasThreeOrLess;

  const admin = createAdminClient();

  // Preserve payment state across edits.
  const { data: existing } = await admin
    .from("bids")
    .select("id, paid, paid_at, payment_claimed")
    .eq("round_id", round.id)
    .eq("user_id", profile.id)
    .maybeSingle();

  let bidId: string;
  if (existing) {
    const { error } = await admin
      .from("bids")
      .update({ nickname, email: profile.email, is_double, has_sniper, has_passfail, amount_due, frozen })
      .eq("id", existing.id);
    if (error) return { ok: false, error: "שמירת ההימור נכשלה." };
    bidId = existing.id;
  } else {
    const { data: created, error } = await admin
      .from("bids")
      .insert({
        round_id: round.id,
        user_id: profile.id,
        nickname,
        email: profile.email,
        is_double,
        has_sniper,
        has_passfail,
        amount_due,
        frozen,
      })
      .select("id")
      .single();
    if (error || !created) return { ok: false, error: "שמירת ההימור נכשלה." };
    bidId = created.id;
  }

  // Replace predictions
  await admin.from("bid_seats").delete().eq("bid_id", bidId);
  if (seats.length) await admin.from("bid_seats").insert(seats.map((s) => ({ bid_id: bidId, ...s })));
  await admin.from("bid_passfail").delete().eq("bid_id", bidId);
  if (passfail.length)
    await admin.from("bid_passfail").insert(passfail.map((s) => ({ bid_id: bidId, ...s })));

  // Email the payment link + amount on first submission (no-ops without RESEND_API_KEY).
  if (!existing && profile.email) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://chagiga-democracy-swart.vercel.app";
    await sendEmail({
      to: profile.email,
      subject: "ההימור נקלט — נותר לשלם 💳",
      html: paymentEmailHtml({ nickname, amount: amount_due, payboxUrl: round.paybox_url, siteUrl }),
    });
  }

  revalidatePath("/");
  revalidatePath("/me");
  revalidatePath("/bet");
  return { ok: true, frozen };
}

/** User marks that they paid in PayBox (awaits admin confirmation). */
export async function claimPaid() {
  const profile = await requireUser();
  const round = await getActiveRound();
  if (!round) return;
  const admin = createAdminClient();
  await admin
    .from("bids")
    .update({ payment_claimed: true })
    .eq("round_id", round.id)
    .eq("user_id", profile.id);
  revalidatePath("/me");
}
